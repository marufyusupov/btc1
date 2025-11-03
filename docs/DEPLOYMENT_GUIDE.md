# BTC1USD Protocol Deployment Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn** package manager
3. **MetaMask** or compatible wallet
4. **Base Sepolia ETH** for gas fees
5. **BaseScan API Key** (optional, for contract verification)

## Environment Setup

1. Clone the repository and install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Copy the environment template:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Fill in your environment variables:
\`\`\`env
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
DEV_WALLET_ADDRESS=0x1234567890123456789012345678901234567890
ENDOWMENT_WALLET_ADDRESS=0x2345678901234567890123456789012345678901
EMERGENCY_COUNCIL_ADDRESS=0x3456789012345678901234567890123456789012
MERKL_DISTRIBUTOR_ADDRESS=0x4567890123456789012345678901234567890123
\`\`\`

## Deployment Steps

### Step 1: Deploy to Base Sepolia

\`\`\`bash
npx hardhat run scripts/deploy.js --network base-sepolia
\`\`\`

This will deploy all contracts and output the addresses. Save these addresses!

### Step 2: Update Environment Variables

Update your `.env` file with the deployed contract addresses:

\`\`\`env
BTC1USD_TOKEN_ADDRESS=0x...
VAULT_ADDRESS=0x...
PRICE_ORACLE_ADDRESS=0x...
WEEKLY_DISTRIBUTION_ADDRESS=0x...
ENDOWMENT_MANAGER_ADDRESS=0x...
PROTOCOL_GOVERNANCE_ADDRESS=0x...
\`\`\`

### Step 3: Verify Contracts (Optional)

Update the addresses in `scripts/verify-contracts.js` and run:

\`\`\`bash
npx hardhat run scripts/verify-contracts.js --network base-sepolia
\`\`\`

### Step 4: Test the Protocol

\`\`\`bash
npx hardhat run scripts/test-protocol.js --network base-sepolia
\`\`\`

## Frontend Setup

### Step 1: Update Contract Addresses

Update the contract addresses in your frontend environment:

\`\`\`env
NEXT_PUBLIC_BTC1USD_ADDRESS=0x...
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_PRICE_ORACLE_ADDRESS=0x...
# ... other addresses
\`\`\`

### Step 2: Start the Frontend

\`\`\`bash
npm run dev
\`\`\`

The frontend will be available at `http://localhost:3000`

## Post-Deployment Configuration

### 1. Set Up Price Oracle

The price oracle needs regular updates. You can:
- Set up an automated price feed service
- Use Chainlink price feeds (requires additional integration)
- Manually update prices for testing

### 2. Add Non-Profit Organizations

Use the Endowment Manager to add approved charitable organizations:

\`\`\`javascript
// Example: Adding a non-profit
await endowmentManager.addNonProfit(
    "0x...", // wallet address
    "Charity Name",
    "Description of the charity",
    "https://charity-website.com"
);
\`\`\`

### 3. Configure Merkl Distribution

Set up the Merkl distributor for weekly reward distributions. This requires:
- Registering with Merkl protocol
- Configuring distribution parameters
- Setting up automated distribution triggers

## Security Considerations

### 1. Multi-Signature Setup

For production deployment, consider using multi-signature wallets for:
- Admin functions
- Emergency council
- Developer wallet
- Endowment wallet

### 2. Timelock Contracts

Implement timelock contracts for critical parameter changes:
- Collateral ratio adjustments
- Fee modifications
- Oracle updates

### 3. Monitoring

Set up monitoring for:
- Collateral ratio health
- Oracle price staleness
- Weekly distribution execution
- Emergency pause triggers

## Mainnet Deployment

### Differences from Testnet

1. **Real Collateral Tokens**: Use actual WBTC, cbBTC, tBTC addresses
2. **Production Oracles**: Integrate with Chainlink or other reliable price feeds
3. **Security Audits**: Complete comprehensive security audits
4. **Governance**: Implement proper governance mechanisms
5. **Insurance**: Consider protocol insurance coverage

### Mainnet Addresses

Update `hardhat.config.js` for mainnet deployment:

\`\`\`javascript
"base-mainnet": {
  url: "https://mainnet.base.org",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 8453
}
\`\`\`

## Troubleshooting

### Common Issues

1. **Gas Estimation Failed**
   - Check contract addresses are correct
   - Ensure sufficient ETH balance
   - Verify network configuration

2. **Transaction Reverted**
   - Check collateral ratio requirements
   - Verify token approvals
   - Ensure oracle prices are not stale

3. **Frontend Connection Issues**
   - Verify contract addresses in environment
   - Check network configuration
   - Ensure MetaMask is connected to Base Sepolia

### Getting Help

- Check the technical documentation
- Review contract events and logs
- Use BaseScan to inspect transactions
- Join the community Discord/Telegram

## Maintenance

### Regular Tasks

1. **Price Oracle Updates**: Ensure BTC prices are updated regularly
2. **Weekly Distributions**: Monitor and execute weekly reward distributions
3. **Monthly Endowment**: Execute monthly charitable distributions
4. **Health Monitoring**: Monitor collateral ratios and system health
5. **Security Updates**: Keep dependencies and contracts updated

### Emergency Procedures

1. **Emergency Pause**: Use emergency council to pause protocol if needed
2. **Oracle Failure**: Have backup price feed mechanisms
3. **Collateral Crisis**: Monitor and respond to severe market downturns
4. **Smart Contract Issues**: Have upgrade/migration procedures ready

This deployment guide provides a comprehensive overview of setting up the BTC1USD protocol from development to production.
