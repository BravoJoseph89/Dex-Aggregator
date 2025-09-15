const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Token addresses
  const tokens = {
    'SEFI': '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    'CHLOE': '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    'ZOE': '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    'MAGGIE': '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
  };
  
  console.log("Connected to the local Hardhat network");
  console.log("Account address:", deployer.address);
  
  // Get ETH balance
  const ethBalance = await ethers.provider.getBalance(deployer.address);
  console.log("\nETH balance:", ethers.utils.formatEther(ethBalance), "ETH\n");
  
  // Check each token balance
  for (const [name, address] of Object.entries(tokens)) {
    try {
      const token = await ethers.getContractAt("IERC20", address);
      const balance = await token.balanceOf(deployer.address);
      console.log(`${name} balance:`, ethers.utils.formatEther(balance), name);
    } catch (error) {
      console.error(`Error checking ${name} balance:`, error.message);
    }
  }
  
  if (ethBalance.eq(0)) {
    console.warn("\nWARNING: Your account has 0 ETH. Make sure you're using the correct account.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
