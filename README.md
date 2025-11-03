# BTC1USD Protocol

A Shariah-compliant, Bitcoin-backed stable asset protocol deployed on Base Sepolia.

## Prerequisites & Version Requirements

### Required Versions (Locked for Compatibility)

- **Node.js**: `22.19.0` (see `.nvmrc`)
- **npm**: `>=10.0.0`
- **Hardhat**: `2.26.3`
- **TypeScript**: `5.9.2`
- **Next.js**: `14.2.16`
- **Ethers.js**: `6.15.0`
- **Wagmi**: `2.17.2`
- **Viem**: `2.37.8`

### Installation

```bash
# 1. Use correct Node.js version (if using nvm)
nvm use

# 2. Install dependencies with exact versions
npm ci

# 3. Verify installation
npm run build
npm test
```

**Important**: All dependency versions are locked to ensure reproducible builds. The `package.json` uses exact versions (no `^` or `~`) and `package-lock.json` should be committed to version control.

## Quick Start

### Deployment

```bash
# Deploy the protocol
npx hardhat run scripts/deploy.js --network base-sepolia
```

### Fixing Token Holder Issues

If you encounter issues with token holder identification for merkle distributions, use these scripts:

```bash
# Debug current token holder status
node scripts/debug-token-holders.js

# Fix token holder issues by creating test holders
node scripts/fix-token-holders.js

# Mint tokens to specific addresses (alternative approach)
node scripts/mint-tokens.js
```

### Core Contracts

- **BTC1 Token**: ERC20 token with controlled minting
- **Vault**: Manages collateral and handles minting/redemption  
- **Price Oracle**: Provides BTC/USD price feeds
- **Weekly Distribution**: Handles profit-sharing distributions
- **Merkle Distributor**: Manages merkle-based token distributions with batch transfer capability
- **Endowment Manager**: Manages charitable fund distributions
- **Protocol Governance**: System administration and emergency controls

### Key Features

- **Over-collateralized**: Minimum 110% Bitcoin backing
- **Profit-sharing**: Weekly distributions when surplus exists
- **Shariah-compliant**: No riba, includes charitable giving
- **Multi-collateral**: Supports WBTC, cbBTC, tBTC
- **Batch Transfer**: Efficient distribution of tokens to multiple wallets
- **Emergency controls**: Pause functionality and governance

## New Functionality: Merkle Distributor Batch Transfer

The Merkle Distributor contract has been enhanced with batch transfer functionality similar to the Dev Wallet and Endowment Wallet contracts. This allows for efficient distribution of BTC1 tokens to multiple recipients in a single transaction.

Key features:
- Wallet management (add, update, remove, activate, deactivate)
- Batch transfer of tokens to multiple recipients
- Distribution statistics tracking
- Integration with the Treasury Dashboard UI

See [MERKLE_DISTRIBUTOR_BATCH_TRANSFER.md](MERKLE_DISTRIBUTOR_BATCH_TRANSFER.md) for detailed documentation.

## Documentation

- [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) - Detailed technical specs
- [Simple Explanation](docs/SIMPLE_EXPLANATION.md) - Easy-to-understand overview
- [Merkle Distributor Batch Transfer](MERKLE_DISTRIBUTOR_BATCH_TRANSFER.md) - Documentation for new batch transfer functionality

## Contract Addresses (Base Sepolia)

*Addresses will be populated after deployment*

## Security

- Multi-signature admin controls
- Time-delayed parameter changes
- Emergency pause functionality
- Comprehensive testing suite

## License

MIT License