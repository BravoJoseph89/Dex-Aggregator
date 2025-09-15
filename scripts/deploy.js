const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy SEFI Token (DEX1 - Token 1)
  const Sefi = await ethers.getContractFactory("Sefi");
  const sefi = await Sefi.deploy(ethers.utils.parseEther("1000000"));
  await sefi.deployed();
  console.log("SEFI Token deployed to:", sefi.address);

  // Deploy CHLOE Token (DEX1 - Token 2)
  const Chloe = await ethers.getContractFactory("Chloe");
  const chloe = await Chloe.deploy(ethers.utils.parseEther("1000000"));
  await chloe.deployed();
  console.log("CHLOE Token deployed to:", chloe.address);

  // Deploy ZOE Token (DEX2 - Token 1)
  const Zoe = await ethers.getContractFactory("Zoe");
  const zoe = await Zoe.deploy(ethers.utils.parseEther("1000000"));
  await zoe.deployed();
  console.log("ZOE Token deployed to:", zoe.address);

  // Deploy MAGGIE Token (DEX2 - Token 2)
  const Maggie = await ethers.getContractFactory("Maggie");
  const maggie = await Maggie.deploy(ethers.utils.parseEther("1000000"));
  await maggie.deployed();
  console.log("MAGGIE Token deployed to:", maggie.address);

  // Deploy DEX1 (SEFI/CHLOE)
  const AMM1 = await ethers.getContractFactory("AMM1");
  const amm1 = await AMM1.deploy(sefi.address, chloe.address);
  await amm1.deployed();
  console.log("DEX1 (SEFI/CHLOE) deployed to:", amm1.address);

  // Deploy DEX2 (ZOE/MAGGIE)
  const AMM2 = await ethers.getContractFactory("AMM2");
  const amm2 = await AMM2.deploy(zoe.address, maggie.address);
  await amm2.deployed();
  console.log("DEX2 (ZOE/MAGGIE) deployed to:", amm2.address);

  // Deploy DexAggregator
  const DexAggregator = await ethers.getContractFactory("DexAggregator");
  const dexAggregator = await DexAggregator.deploy(amm1.address, amm2.address);
  await dexAggregator.deployed();
  console.log("DexAggregator deployed to:", dexAggregator.address);

  // Fund DEX1 with liquidity (SEFI/CHLOE)
  const liquidityAmount1 = ethers.utils.parseEther("1000");
  
  // Approve tokens for DEX1
  await sefi.approve(amm1.address, liquidityAmount1.mul(2));
  await chloe.approve(amm1.address, liquidityAmount1.mul(2));
  
  // Add liquidity to DEX1
  await amm1.addLiquidity(liquidityAmount1, liquidityAmount1);
  console.log("Added liquidity to DEX1 (SEFI/CHLOE)");

  // Fund DEX2 with liquidity (ZOE/MAGGIE)
  const liquidityAmount2 = ethers.utils.parseEther("800");
  
  // Approve tokens for DEX2
  await zoe.approve(amm2.address, liquidityAmount2.mul(2));
  await maggie.approve(amm2.address, liquidityAmount2.mul(2));
  
  // Add liquidity to DEX2 with a different ratio
  await amm2.addLiquidity(liquidityAmount2.mul(2), liquidityAmount2);
  console.log("Added liquidity to DEX2 (ZOE/MAGGIE)");

  // Fund test accounts with tokens for testing
  const testAccount1 = (await ethers.getSigners())[1].address; // For DEX1 tokens
  const testAccount2 = (await ethers.getSigners())[2].address; // For DEX2 tokens
  
  // Fund test accounts with DEX1 tokens
  await sefi.transfer(testAccount1, ethers.utils.parseEther("100"));
  await chloe.transfer(testAccount1, ethers.utils.parseEther("100"));
  
  // Fund test accounts with DEX2 tokens
  await zoe.transfer(testAccount2, ethers.utils.parseEther("100"));
  await maggie.transfer(testAccount2, ethers.utils.parseEther("100"));
  
  // Fund deployer account with tokens for testing
  await sefi.transfer(deployer.address, ethers.utils.parseEther("1000"));
  await chloe.transfer(deployer.address, ethers.utils.parseEther("1000"));
  await zoe.transfer(deployer.address, ethers.utils.parseEther("1000"));
  await maggie.transfer(deployer.address, ethers.utils.parseEther("1000"));
  
  console.log("\nFunded test accounts:");
  console.log(`- Account 1 (DEX1): ${testAccount1}`);
  console.log(`- Account 2 (DEX2): ${testAccount2}`);

  console.log("\n=== Deployment Complete ===");
  console.log("\n=== Contract Addresses ===");
  console.log("\n=== DEX1 Tokens ===");
  console.log("SEFI Token:", sefi.address);
  console.log("CHLOE Token:", chloe.address);
  
  console.log("\n=== DEX2 Tokens ===");
  console.log("ZOE Token:", zoe.address);
  console.log("MAGGIE Token:", maggie.address);
  
  console.log("\n=== DEXes ===");
  console.log("DEX1 (SEFI/CHLOE):", amm1.address);
  console.log("DEX2 (ZOE/MAGGIE):", amm2.address);
  
  console.log("\n=== Aggregator ===");
  console.log("DexAggregator:", dexAggregator.address);

  console.log("\n=== Frontend .env ===");
  console.log(`REACT_APP_SEFI_ADDRESS=${sefi.address}`);
  console.log(`REACT_APP_CHLOE_ADDRESS=${chloe.address}`);
  console.log(`REACT_APP_ZOE_ADDRESS=${zoe.address}`);
  console.log(`REACT_APP_MAGGIE_ADDRESS=${maggie.address}`);
  console.log(`REACT_APP_AMM1_ADDRESS=${amm1.address}`);
  console.log(`REACT_APP_AMM2_ADDRESS=${amm2.address}`);
  console.log(`REACT_APP_AGGREGATOR_ADDRESS=${dexAggregator.address}`);
  
  console.log("\n=== Test Accounts ===");
  console.log("DEX1 Test Account:", testAccount1);
  console.log("DEX2 Test Account:", testAccount2);
  console.log("\nNote: Use the corresponding private keys from your Hardhat node for testing.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
