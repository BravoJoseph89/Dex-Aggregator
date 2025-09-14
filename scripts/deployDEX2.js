const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying DEX2 contracts with the account:", deployer.address);

  // Deploy Zoe Token
  const Zoe = await hre.ethers.getContractFactory("Zoe");
  const zoe = await Zoe.deploy(ethers.utils.parseEther("1000000")); // 1M tokens with 18 decimals
  await zoe.deployed();
  console.log("Zoe deployed to:", zoe.address);

  // Deploy Maggie Token
  const Maggie = await hre.ethers.getContractFactory("Maggie");
  const maggie = await Maggie.deploy(ethers.utils.parseEther("1000000")); // 1M tokens with 18 decimals
  await maggie.deployed();
  console.log("Maggie deployed to:", maggie.address);

  // Deploy AMM2
  const AMM2 = await hre.ethers.getContractFactory("AMM2");
  const amm2 = await AMM2.deploy(zoe.address, maggie.address);
  await amm2.deployed();
  console.log("AMM2 deployed to:", amm2.address);

  // Save addresses to a file
  const fs = require("fs");
  const path = require("path");
  
  const addresses = {
    zoe: zoe.address,
    maggie: maggie.address,
    amm2: amm2.address
  };

  const addressesPath = path.join(__dirname, "..", "deployed-addresses-d2.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to:", addressesPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
