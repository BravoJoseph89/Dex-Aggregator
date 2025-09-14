const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Sefi Token
  const Sefi = await hre.ethers.getContractFactory("Sefi");
  const sefi = await Sefi.deploy(ethers.utils.parseEther("1000000")); // 1M tokens with 18 decimals
  await sefi.deployed();
  console.log("Sefi deployed to:", sefi.address);

  // Deploy Chloe Token
  const Chloe = await hre.ethers.getContractFactory("Chloe");
  const chloe = await Chloe.deploy(ethers.utils.parseEther("1000000")); // 1M tokens with 18 decimals
  await chloe.deployed();
  console.log("Chloe deployed to:", chloe.address);

  // Deploy AMM1
  const AMM1 = await hre.ethers.getContractFactory("AMM1");
  const amm1 = await AMM1.deploy(sefi.address, chloe.address);
  await amm1.deployed();
  console.log("AMM1 deployed to:", amm1.address);

  // Save addresses to a file
  const fs = require("fs");
  const path = require("path");
  
  const addresses = {
    sefi: sefi.address,
    chloe: chloe.address,
    amm1: amm1.address
  };

  const addressesPath = path.join(__dirname, "..", "deployed-addresses-d1.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to:", addressesPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
