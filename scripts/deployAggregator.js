const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DexAggregator with the account:", deployer.address);

  // Load DEX1 addresses
  const dex1Path = path.join(__dirname, "..", "deployed-addresses-d1.json");
  if (!fs.existsSync(dex1Path)) {
    throw new Error("DEX1 addresses file not found. Please deploy DEX1 first.");
  }
  const dex1Addresses = JSON.parse(fs.readFileSync(dex1Path, "utf8"));
  
  // Load DEX2 addresses
  const dex2Path = path.join(__dirname, "..", "deployed-addresses-d2.json");
  if (!fs.existsSync(dex2Path)) {
    throw new Error("DEX2 addresses file not found. Please deploy DEX2 first.");
  }
  const dex2Addresses = JSON.parse(fs.readFileSync(dex2Path, "utf8"));

  console.log("DEX1 AMM address:", dex1Addresses.amm1);
  console.log("DEX2 AMM address:", dex2Addresses.amm2);

  // Deploy the aggregator
  console.log("Deploying DexAggregator...");
  const DexAggregator = await ethers.getContractFactory("DexAggregator");
  const aggregator = await DexAggregator.deploy(
    dex1Addresses.amm1,
    dex2Addresses.amm2
  );
  await aggregator.deployed();
  
  console.log("DexAggregator deployed to:", aggregator.address);

  // Save aggregator address with additional info
  const addresses = {
    aggregator: aggregator.address,
    dex1: {
      address: dex1Addresses.amm1,
      token1: dex1Addresses.sefi,
      token2: dex1Addresses.chloe
    },
    dex2: {
      address: dex2Addresses.amm2,
      token1: dex2Addresses.zoe,
      token2: dex2Addresses.maggie
    },
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const addressesPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Aggregator addresses saved to:", addressesPath);

  // Verify contract on Etherscan if API key is available
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await aggregator.deployTransaction.wait(6);

    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: aggregator.address,
        constructorArguments: [
          dex1Addresses.amm1,
          dex2Addresses.amm2
        ],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.warn("Contract verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
