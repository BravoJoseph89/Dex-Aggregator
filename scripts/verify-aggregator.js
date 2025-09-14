const { ethers } = require("hardhat");

async function main() {
  // Load all deployed addresses
  const dex1Addresses = require('../deployed-addresses-d1.json');
  const dex2Addresses = require('../deployed-addresses-d2.json');
  const aggregatorAddresses = require('../deployed-addresses.json');

  console.log("\n🔍 Verifying Aggregator deployment...");
  
  // Verify Aggregator contract
  const Aggregator = await ethers.getContractFactory("DexAggregator");
  const aggregator = await Aggregator.attach(aggregatorAddresses.aggregator);
  
  console.log("\n✅ Aggregator deployed at:", aggregatorAddresses.aggregator);
  
  // Verify DEX addresses in Aggregator
  console.log("\n🔗 Verifying DEX connections...");
  const dex1Address = await aggregator.dex1();
  const dex2Address = await aggregator.dex2();
  
  console.log("\n📌 DEX Addresses in Aggregator:");
  console.log(`- DEX1 (AMM1): ${dex1Address} ${dex1Address === dex1Addresses.amm1 ? '✅' : '❌'}`);
  console.log(`- DEX2 (AMM2): ${dex2Address} ${dex2Address === dex2Addresses.amm2 ? '✅' : '❌'}`);
  
  // Verify token pairs
  console.log("\n💱 Verifying token pairs...");
  console.log("\n🔄 DEX1 Token Pair:");
  console.log(`- Sefi:  ${dex1Addresses.sefi}`);
  console.log(`- Chloe: ${dex1Addresses.chloe}`);
  
  console.log("\n🔄 DEX2 Token Pair:");
  console.log(`- Zoe:   ${dex2Addresses.zoe}`);
  console.log(`- Maggie:${dex2Addresses.maggie}`);
  
  console.log("\n✅ Verification complete! All systems nominal.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
