const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying DexAggregator with the account:", deployer.address);

  // Load DEX1 addresses
  const dex1Path = path.join(__dirname, "../deployed-addresses-d1.json");
  const dex1Addresses = JSON.parse(fs.readFileSync(dex1Path, "utf8"));
  
  // Load DEX2 addresses
  const dex2Path = path.join(__dirname, "../deployed-addresses-d2.json");
  const dex2Addresses = JSON.parse(fs.readFileSync(dex2Path, "utf8"));

  console.log("DEX1 AMM address:", dex1Addresses.amm1);
  console.log("DEX2 AMM address:", dex2Addresses.amm2);

  // Deploy the aggregator
  const DexAggregator = await hre.ethers.getContractFactory("DexAggregator");
  const aggregator = await DexAggregator.deploy(dex1Addresses.amm1, dex2Addresses.amm2);
  await aggregator.deployed();
  
  console.log("DexAggregator deployed to:", aggregator.address);

  // Save aggregator address
  const addresses = {
    aggregator: aggregator.address,
    dex1: dex1Addresses.amm1,
    dex2: dex2Addresses.amm2
  };

  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Aggregator addresses saved to:", addressesPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
