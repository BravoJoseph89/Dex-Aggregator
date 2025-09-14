const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX1", function () {
  let Sefi, Chloe, AMM1;
  let sefi, chloe, amm1;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy Sefi Token
    Sefi = await ethers.getContractFactory("Sefi");
    sefi = await Sefi.deploy(ethers.utils.parseEther("1000000"));
    await sefi.deployed();

    // Deploy Chloe Token
    Chloe = await ethers.getContractFactory("Chloe");
    chloe = await Chloe.deploy(ethers.utils.parseEther("1000000"));
    await chloe.deployed();

    // Deploy AMM1
    AMM1 = await ethers.getContractFactory("AMM1");
    amm1 = await AMM1.deploy(sefi.address, chloe.address);
    await amm1.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right token names and symbols", async function () {
      expect(await sefi.name()).to.equal("Sefi");
      expect(await sefi.symbol()).to.equal("SEFI");
      expect(await chloe.name()).to.equal("Chloe");
      expect(await chloe.symbol()).to.equal("CHLO");
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalanceSefi = await sefi.balanceOf(owner.address);
      const ownerBalanceChloe = await chloe.balanceOf(owner.address);
      expect(await sefi.totalSupply()).to.equal(ownerBalanceSefi);
      expect(await chloe.totalSupply()).to.equal(ownerBalanceChloe);
    });
  });

  describe("AMM Functionality", function () {
    it("Should allow adding liquidity", async function () {
      // Approve AMM to spend tokens
      await sefi.approve(amm1.address, 1000);
      await chloe.approve(amm1.address, 1000);
      
      // Add liquidity
      await amm1.addLiquidity(1000, 1000);
      
      // Check balances
      expect(await sefi.balanceOf(amm1.address)).to.equal(1000);
      expect(await chloe.balanceOf(amm1.address)).to.equal(1000);
    });
  });
});
