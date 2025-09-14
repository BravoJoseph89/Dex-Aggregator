const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX2", function () {
  let Zoe, Maggie, AMM2;
  let zoe, maggie, amm2;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy Zoe Token
    Zoe = await ethers.getContractFactory("Zoe");
    zoe = await Zoe.deploy(ethers.utils.parseEther("1000000"));
    await zoe.deployed();

    // Deploy Maggie Token
    Maggie = await ethers.getContractFactory("Maggie");
    maggie = await Maggie.deploy(ethers.utils.parseEther("1000000"));
    await maggie.deployed();

    // Deploy AMM2
    AMM2 = await ethers.getContractFactory("AMM2");
    amm2 = await AMM2.deploy(zoe.address, maggie.address);
    await amm2.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right token names and symbols", async function () {
      expect(await zoe.name()).to.equal("Zoe");
      expect(await zoe.symbol()).to.equal("ZOE");
      expect(await maggie.name()).to.equal("Maggie");
      expect(await maggie.symbol()).to.equal("MAGGIE");
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalanceZoe = await zoe.balanceOf(owner.address);
      const ownerBalanceMaggie = await maggie.balanceOf(owner.address);
      expect(await zoe.totalSupply()).to.equal(ownerBalanceZoe);
      expect(await maggie.totalSupply()).to.equal(ownerBalanceMaggie);
    });
  });

  describe("AMM Functionality", function () {
    it("Should allow adding liquidity", async function () {
      // Approve AMM to spend tokens
      await zoe.approve(amm2.address, 1000);
      await maggie.approve(amm2.address, 1000);
      
      // Add liquidity
      await amm2.addLiquidity(1000, 1000);
      
      // Check balances
      expect(await zoe.balanceOf(amm2.address)).to.equal(1000);
      expect(await maggie.balanceOf(amm2.address)).to.equal(1000);
    });
  });
});
