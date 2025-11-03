const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEPLOYING BTC1USD PROTOCOL WITH DELAYS ===\n");

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  console.log("Deploying with account:", deployer.address);

  // Configuration
  const config = {
    admin: deployer.address,
    emergencyCouncil: process.env.EMERGENCY_COUNCIL || deployer.address,
    chainlinkBtcUsdFeed: "0x0FB99723Aee6f420beAD13e6bBB79b7E6F034298",
  };

  // Helper function for delays
  async function delay(ms) {
    console.log(`  ⏳ Waiting ${ms/1000} seconds...`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Deploy one contract with delay
  async function deployWithDelay(name, factory, ...args) {
    console.log(`\n📦 Deploying ${name}...`);
    const contract = await factory.deploy(...args);
    console.log(`  ⏳ Waiting for deployment confirmation...`);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`  ✅ ${name} deployed to: ${address}`);
    
    // Longer delay between deployments
    await delay(30000); // 30 seconds
    return { contract, address };
  }

  try {
    // Deploy in smaller batches with longer delays
    console.log("\n=== STEP 1: Deploying Mock Tokens ===");
    
    const MockWBTC = await ethers.getContractFactory("MockWBTC");
    const { contract: mockWBTC, address: mockWBTCAddress } = await deployWithDelay(
      "MockWBTC",
      MockWBTC,
      deployer.address
    );

    const MockCBTC = await ethers.getContractFactory("MockERC20");
    const { contract: mockCBTC, address: mockCBTCAddress } = await deployWithDelay(
      "MockCBTC",
      MockCBTC,
      "Coinbase Wrapped BTC",
      "cbBTC",
      8
    );

    console.log("\n=== STEP 2: Deploying Wallet Contracts ===");
    
    const DevWallet = await ethers.getContractFactory("DevWallet");
    const { contract: devWallet, address: devWalletAddress } = await deployWithDelay(
      "DevWallet",
      DevWallet
    );

    const EndowmentWallet = await ethers.getContractFactory("EndowmentWallet");
    const { contract: endowmentWallet, address: endowmentWalletAddress } = await deployWithDelay(
      "EndowmentWallet",
      EndowmentWallet
    );

    console.log("\n=== STEP 3: Deploying Core Contracts ===");
    
    const BTC1USD = await ethers.getContractFactory("BTC1USD");
    const { contract: btc1usd, address: btc1usdAddress } = await deployWithDelay(
      "BTC1USD",
      BTC1USD,
      config.admin
    );

    const ChainlinkBTCOracle = await ethers.getContractFactory("ChainlinkBTCOracle");
    const { contract: priceOracle, address: priceOracleAddress } = await deployWithDelay(
      "ChainlinkBTCOracle",
      ChainlinkBTCOracle,
      config.admin
    );

    const Vault = await ethers.getContractFactory("Vault");
    const { contract: vault, address: vaultAddress } = await deployWithDelay(
      "Vault",
      Vault,
      btc1usdAddress,
      priceOracleAddress,
      config.admin,
      devWalletAddress,
      endowmentWalletAddress
    );

    console.log("\n=== DEPLOYMENT COMPLETED SUCCESSFULLY ===");
    console.log("Addresses:");
    console.log("  MockWBTC:", mockWBTCAddress);
    console.log("  MockCBTC:", mockCBTCAddress);
    console.log("  DevWallet:", devWalletAddress);
    console.log("  EndowmentWallet:", endowmentWalletAddress);
    console.log("  BTC1USD:", btc1usdAddress);
    console.log("  ChainlinkBTCOracle:", priceOracleAddress);
    console.log("  Vault:", vaultAddress);

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });