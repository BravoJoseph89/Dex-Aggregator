const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DEX1 contracts with the account:", deployer.address);

  // Deploy Sefi Token
  const Sefi = await ethers.getContractFactory("Sefi");
  const sefi = await Sefi.deploy(ethers.utils.parseEther("1000000")); // 1M tokens with 18 decimals
  await sefi.deployed();
  console.log("Sefi deployed to:", sefi.address);

  // Deploy Chloe Token
  const Chloe = await ethers.getContractFactory("Chloe");
  const chloe = await Chloe.deploy(ethers.utils.parseEther("1000000")); // 1M tokens with 18 decimals
  await chloe.deployed();
  console.log("Chloe deployed to:", chloe.address);

  // Deploy AMM1
  const AMM1 = await ethers.getContractFactory("AMM1");
  const amm1 = await AMM1.deploy(sefi, chloe);
  await amm1.deployed();
  console.log("AMM1 deployed to:", amm1.address);

  // Save addresses to a file
  const fs = require("fs");
  const path = require("path");
  
  const addresses = {
    sefi: sefi.address,
    chloe: chloe.address,
    amm1: amm1.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address
  };

  const addressesPath = path.join(__dirname, "..", "deployed-addresses-d1.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to:", addressesPath);

  // Verify contracts on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await sefi.deployTransaction.wait(6);
    await chloe.deployTransaction.wait(6);
    await amm1.deployTransaction.wait(6);

    console.log("Verifying contracts...");
    await hre.run("verify:verify", {
      address: sefi.address,
      constructorArguments: [ethers.utils.parseEther("1000000")],
    });

    await hre.run("verify:verify", {
      address: chloe.address,
      constructorArguments: [ethers.utils.parseEther("1000000")],
    });

    await hre.run("verify:verify", {
      address: amm1.address,
      constructorArguments: [sefi.address, chloe.address],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
