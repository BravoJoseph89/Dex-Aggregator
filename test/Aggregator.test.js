const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DexAggregator", function () {
  // Contracts
  let sefi, chloe, amm1;  // DEX1
  let zoe, maggie, amm2;  // DEX2
  let aggregator;
  
  // Signers
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // Deploy DEX1
    const Sefi = await ethers.getContractFactory("Sefi");
    sefi = await Sefi.deploy(ethers.utils.parseEther("1000000"));
    await sefi.deployed();

    const Chloe = await ethers.getContractFactory("Chloe");
    chloe = await Chloe.deploy(ethers.utils.parseEther("1000000"));
    await chloe.deployed();

    const AMM1 = await ethers.getContractFactory("AMM1");
    amm1 = await AMM1.deploy(sefi.address, chloe.address);
    await amm1.deployed();

    // Deploy DEX2
    const Zoe = await ethers.getContractFactory("Zoe");
    zoe = await Zoe.deploy(ethers.utils.parseEther("1000000"));
    await zoe.deployed();

    const Maggie = await ethers.getContractFactory("Maggie");
    maggie = await Maggie.deploy(ethers.utils.parseEther("1000000"));
    await maggie.deployed();

    const AMM2 = await ethers.getContractFactory("AMM2");
    amm2 = await AMM2.deploy(zoe.address, maggie.address);
    await amm2.deployed();

    // Deploy Aggregator
    const DexAggregator = await ethers.getContractFactory("DexAggregator");
    aggregator = await DexAggregator.deploy(amm1.address, amm2.address);
    await aggregator.deployed();

    // Add initial liquidity to both DEXes
    await addLiquidity(amm1, sefi, chloe, "10000", "10000");
    await addLiquidity(amm2, zoe, maggie, "9000", "11000"); // Different ratio to test price difference
  });

  async function addLiquidity(amm, tokenA, tokenB, amountA, amountB) {
    const amountAWei = ethers.utils.parseEther(amountA);
    const amountBWei = ethers.utils.parseEther(amountB);
    
    await tokenA.approve(amm.address, amountAWei);
    await tokenB.approve(amm.address, amountBWei);
    await amm.addLiquidity(amountAWei, amountBWei);
  }

  describe("Deployment", function () {
    it("Should set the right DEX addresses", async function () {
      expect(await aggregator.dex1()).to.equal(amm1.address);
      expect(await aggregator.dex2()).to.equal(amm2.address);
    });
  });

  describe("Price Comparison", function () {
    it("Should return the best price between DEXes", async function () {
      // DEX1 price: 1 Sefi = 1 Chloe (10000/10000)
      // DEX2 price: 1 Zoe = 1.222 Maggie (11000/9000)
      // So for selling Sefi/Zoe, DEX2 should give better price
      
      const amountIn = ethers.utils.parseEther("100");
      
      const [amountOut, bestDex] = await aggregator.getBestPrice(
        sefi.address,
        chloe.address,
        amountIn
      );
      
      // The best DEX should be the one that gives more output tokens
      const dex1Out = await amm1.getAmountOut(amountIn, sefi.address);
      const dex2Out = await amm2.getAmountOut(amountIn, zoe.address);
      
      if (dex1Out > dex2Out) {
        expect(bestDex).to.equal(amm1.address);
      } else {
        expect(bestDex).to.equal(amm2.address);
      }
      
      expect(amountOut).to.equal(dex1Out > dex2Out ? dex1Out : dex2Out);
    });
  });

  describe("Swapping", function () {
    it("Should execute swaps using the best available price", async function () {
      // Transfer some tokens to user1 for testing
      const transferAmount = ethers.utils.parseEther("1000");
      await sefi.transfer(user1.address, transferAmount);
      
      // Approve aggregator to spend user's tokens
      await sefi.connect(user1).approve(aggregator.address, transferAmount);
      
      // Get initial balances
      const initialBalance = await chloe.balanceOf(user1.address);
      
      // Perform swap through aggregator
      const amountIn = ethers.utils.parseEther("100");
      const minAmountOut = 0; // For testing
      
      await aggregator.connect(user1).swap(
        sefi.address,
        chloe.address,
        amountIn,
        minAmountOut,
        user1.address
      );
      
      // Check if user received tokens
      const finalBalance = await chloe.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
});
