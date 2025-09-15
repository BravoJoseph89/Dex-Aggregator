const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DEX2 contracts with the account:", deployer.address);

  // Deploy Zoe Token
  const Zoe = await ethers.getContractFactory("Zoe");
  const zoe = await Zoe.deploy(ethers.utils.parseEther("1000000")); // 1M tokens with 18 decimals
  await zoe.deployed();
  console.log("Zoe deployed to:", zoe.address);

  // Deploy Maggie Token
  const Maggie = await ethers.getContractFactory("Maggie");
  const maggie = await Maggie.deploy(ethers.utils.parseEther("1000000")); // 1M tokens with 18 decimals
  await maggie.deployed();
  console.log("Maggie deployed to:", maggie.address);

  // Deploy AMM2
  const AMM2 = await ethers.getContractFactory("AMM2");
  const amm2 = await AMM2.deploy(zoe, maggie);
  await amm2.deployed();
  console.log("AMM2 deployed to:", amm2.address);

  // Save addresses to a file
  const fs = require("fs");
  const path = require("path");
  
  const addresses = {
    zoe: zoe.address,
    maggie: maggie.address,
    amm2: amm2.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address
  };

  const addressesPath = path.join(__dirname, "..", "deployed-addresses-d2.json");
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to:", addressesPath);

  // Verify contracts on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await zoe.deployTransaction.wait(6);
    await maggie.deployTransaction.wait(6);
    await amm2.deployTransaction.wait(6);

    console.log("Verifying contracts...");
    await hre.run("verify:verify", {
      address: zoe.address,
      constructorArguments: [ethers.utils.parseEther("1000000")],
    });

    await hre.run("verify:verify", {
      address: maggie.address,
      constructorArguments: [ethers.utils.parseEther("1000000")],
    });

    await hre.run("verify:verify", {
      address: amm2.address,
      constructorArguments: [zoe.address, maggie.address],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
