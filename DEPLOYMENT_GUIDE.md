# BTC1USD Protocol Deployment Guide

## Quick Deployment

```bash
# 1. Ensure you have Base Sepolia ETH (minimum 0.05 ETH)
# 2. Set your private key in .env
DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere

# 3. Run deployment
npx hardhat run scripts/deploy-complete-base-sepolia.js --network base-sepolia
```

## Deployment Order

The script deploys contracts in this specific order to resolve circular dependencies:

### Step 1: Mock Tokens
- MockWBTC
- MockCBTC (Coinbase Wrapped BTC)
- MockTBTC (Threshold BTC)

### Step 2: Wallet Contracts
- DevWallet (with on-chain distribution tracking)
- EndowmentWallet (with on-chain distribution tracking)

### Step 3: Core Contracts
- BTC1USD (coin token)
- ChainlinkBTCOracle (live BTC/USD price feed)
- Vault (collateral management)

### Step 4: Distribution System (Circular Dependency Resolution)

**Important**: These two contracts have a circular dependency!

1. **Deploy MerkleDistributor** with `weeklyDistribution = ethers.ZeroAddress`
   - Temporarily uses zero address
   - Safe because no functions call weeklyDistribution in constructor

2. **Deploy WeeklyDistribution** with actual `merkleDistributor` address
   - Uses real MerkleDistributor address
   - Automatically excludes MerkleDistributor from holder rewards
   - Also excludes DevWallet and EndowmentWallet

### Step 5: Governance
- EndowmentManager
- ProtocolGovernance
- DAO

### Step 6: Initialize Connections (Complete Circular Dependency)

This step connects all contracts and **completes the circular dependency resolution**:

1. BTC1USD.setVault()
2. BTC1USD.setWeeklyDistribution()
3. **MerkleDistributor.setWeeklyDistribution()** ← Completes circular dependency!
4. ProtocolGovernance.initializeContracts()

### Step 7: Configure Collateral
- Add MockWBTC
- Add MockCBTC
- Add MockTBTC

### Step 8: Mint Test Tokens
- 100 WBTC to deployer
- 100 cbBTC to deployer
- 100 tBTC to deployer

### Step 9: Verify Oracle
- Check live BTC price
- Verify price freshness

### Step 10: Verify Deployment

The script automatically verifies:
- ✅ DAO configuration
- ✅ Circular dependency resolved (MerkleDistributor ↔ WeeklyDistribution)
- ✅ Protocol wallets excluded from holder rewards:
  - MerkleDistributor
  - DevWallet
  - EndowmentWallet

## Post-Deployment

The script automatically:
1. Saves deployment info to `deployment-base-sepolia.json`
2. Displays block explorer links for all contracts
3. Verifies all connections are correct

## Deployment Output

Expected output:
```
📝 Completing circular dependency resolution...
✅ MerkleDistributor.weeklyDistribution correctly set to 0x4c6e...703e
✅ WeeklyDistribution.merklDistributor correctly set to 0xf324...694c
✅ Circular dependency resolved - both contracts now reference each other

📝 Verifying protocol wallet exclusions...
✅ Total excluded addresses: 3
✅ MerkleDistributor excluded from holder rewards
✅ DevWallet excluded from holder rewards
✅ EndowmentWallet excluded from holder rewards
```

## Important Files Generated

1. **deployment-base-sepolia.json** - All contract addresses and configuration
2. Uses this file to update:
   - `.env` - Environment variables
   - `lib/contracts.ts` - Frontend contract addresses

## Updating Frontend

After deployment:

```bash
# 1. Update contract addresses from deployment file
# See: ADDRESS_UPDATE_SUMMARY.md for detailed instructions

# 2. Restart dev server
npm run dev
```

## Testing Exclusion System

```bash
# 1. Get all holders (protocol wallets will be marked as excluded)
npx hardhat run scripts/get-all-holders.js --network base-sepolia

# 2. Execute a distribution (only eligible holders will receive rewards)
# (via frontend or contract interaction)

# 3. Generate merkle tree (protocol wallets will be excluded from claims)
npx hardhat run scripts/generate-distribution-file.js --network base-sepolia
```

## Troubleshooting

### Error: "Insufficient balance"
- Ensure you have at least 0.05 ETH on Base Sepolia
- Get test ETH from Base Sepolia faucet

### Error: "nonce too low/high"
- Script has automatic nonce retry logic
- Wait a few seconds and try again

### Error: "MerkleDistributor.weeklyDistribution mismatch"
- This means the circular dependency resolution failed
- Check STEP 6 completed successfully
- DO NOT proceed with distributions until this is fixed!

### Error: "Protocol wallet NOT excluded"
- This means the exclusion system didn't work correctly
- Check WeeklyDistribution deployment succeeded
- Verify constructor excluded the wallets
- DO NOT proceed with distributions until this is fixed!

## Security Checklist

Before using in production:

- [ ] All contracts deployed successfully
- [ ] Circular dependency verified (both addresses correctly set)
- [ ] All 3 protocol wallets excluded from holder rewards
- [ ] Chainlink oracle returns fresh price
- [ ] Test tokens minted successfully
- [ ] Collateral tokens added to vault
- [ ] All governance contracts initialized
- [ ] Block explorer links accessible
- [ ] deployment-base-sepolia.json saved
- [ ] Frontend updated with new addresses
- [ ] Distribution exclusion tested

## Next Steps

1. Verify contracts on BaseScan (optional):
   ```bash
   npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

2. Update frontend with new addresses:
   - Update `.env` from deployment file
   - Update `lib/contracts.ts` with ABIs if needed

3. Test the protocol:
   - Mint BTC1USD by depositing collateral
   - Execute a weekly distribution
   - Verify protocol wallets don't receive holder rewards
   - Test merkle tree generation and claiming

4. Production setup:
   - Set up multi-sig for admin
   - Set up multi-sig for emergency council
   - Transfer ownership to DAO (after thorough testing)

## Documentation References

- [PROTOCOL_WALLET_EXCLUSION.md](./PROTOCOL_WALLET_EXCLUSION.md) - Exclusion system details
- [CIRCULAR_DEPENDENCY_RESOLUTION.md](./CIRCULAR_DEPENDENCY_RESOLUTION.md) - How circular dependency is resolved
- [ADDRESS_UPDATE_SUMMARY.md](./ADDRESS_UPDATE_SUMMARY.md) - How to update addresses in frontend

## Support

If deployment fails or verification checks fail:
1. Check the error message
2. Verify network connection
3. Check deployer has sufficient ETH
4. Review deployment logs
5. Check contract constructor arguments match
