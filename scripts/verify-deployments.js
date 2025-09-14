const { ethers } = require("hardhat");

async function main() {
  // Load DEX1 addresses
  const dex1Addresses = require('../deployed-addresses-d1.json');
  // Load DEX2 addresses
  const dex2Addresses = require('../deployed-addresses-d2.json');

  console.log("Verifying DEX1 contracts on Sepolia:");
  await verifyContract("Sefi", dex1Addresses.sefi);
  await verifyContract("Chloe", dex1Addresses.chloe);
  await verifyContract("AMM1", dex1Addresses.amm1);

  console.log("\nVerifying DEX2 contracts on Sepolia:");
  await verifyContract("Zoe", dex2Addresses.zoe);
  await verifyContract("Maggie", dex2Addresses.maggie);
  await verifyContract("AMM2", dex2Addresses.amm2);
}

async function verifyContract(name, address) {
  try {
    const code = await ethers.provider.getCode(address);
    if (code === '0x') {
      console.error(`❌ ${name} (${address}): Not deployed or no code at address`);
      return false;
    } else {
      console.log(`✅ ${name} (${address}): Successfully deployed`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error verifying ${name} (${address}):`, error.message);
    return false;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
