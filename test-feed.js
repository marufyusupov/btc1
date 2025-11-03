const { ethers } = require("hardhat");

async function testFeed(address, name) {
  console.log(`\nTesting ${name}: ${address}`);
  
  const abi = [
    "function description() view returns (string)",
    "function decimals() view returns (uint8)",
    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)"
  ];
  
  try {
    const feed = await ethers.getContractAt(abi, address);
    const desc = await feed.description();
    const decimals = await feed.decimals();
    const data = await feed.latestRoundData();
    
    const price = ethers.formatUnits(data[1], decimals);
    const updateTime = new Date(Number(data[3]) * 1000);
    const ageHours = (Date.now() - updateTime.getTime()) / (1000 * 60 * 60);
    
    console.log(`  Description: ${desc}`);
    console.log(`  Price: $${price}`);
    console.log(`  Last Update: ${updateTime.toISOString()}`);
    console.log(`  Age: ${ageHours.toFixed(1)} hours`);
    console.log(`  Status: ${ageHours < 2 ? '✅ FRESH' : '⚠️ STALE'}`);
    
    return ageHours < 2;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("=== TESTING CHAINLINK FEEDS ON BASE SEPOLIA ===");
  
  // Test the feed address you provided
  await testFeed("0xB842f535a88021F95e1a94245Fa549a7f75084Dc", "Provided BTC/USD");
  
  // Test ETH/USD feed (known to work)
  await testFeed("0x5a18357B777011d88a18331eF1b283d5a4990924", "ETH/USD");
  
  console.log("\n=== RECOMMENDATION ===");
  console.log("The BTC/USD feed appears to be stale on Base Sepolia testnet.");
  console.log("\nOptions:");
  console.log("1. Use manual price mode with your oracle");
  console.log("2. Deploy to Base Mainnet (more active feeds)");
  console.log("3. Contact Chainlink about Base Sepolia BTC/USD feed status");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
