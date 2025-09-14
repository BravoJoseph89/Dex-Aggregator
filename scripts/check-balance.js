const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Connected to the Sepolia testnet");
  console.log("Account address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.eq(0)) {
    console.warn("WARNING: Your account has 0 ETH. Get test ETH from a Sepolia faucet.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
