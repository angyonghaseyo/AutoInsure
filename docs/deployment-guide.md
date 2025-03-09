# Deployment Guide

This guide provides detailed instructions for deploying the FlightGuard platform to various networks.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Contract Deployment](#contract-deployment)
  - [Local Deployment](#local-deployment)
  - [Testnet Deployment](#testnet-deployment)
  - [Mainnet Deployment](#mainnet-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Verifying Smart Contracts](#verifying-smart-contracts)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before proceeding with deployment, ensure you have:

- Node.js (v16+) and npm/yarn installed
- A wallet with sufficient funds for the target network
- Access to an RPC endpoint for the selected network (Alchemy, Infura, etc.)
- Chainlink LINK tokens for the oracle (for testnets, you can use faucets)

## Environment Setup

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/flightguard.git
cd flightguard
npm install
```

2. Create a `.env` file based on the provided example:

```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:

```
# Network Configuration
NETWORK=sepolia  # Options: sepolia, mumbai, mainnet, polygon

# Ethereum Node URLs
ETHEREUM_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ETHEREUM_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
POLYGON_MAINNET_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
POLYGON_MUMBAI_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Private Key for Contract Deployment
PRIVATE_KEY=your_wallet_private_key_here

# Etherscan API Key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

## Contract Deployment

### Local Deployment

For development and testing, you can deploy to a local Hardhat node:

1. Start a local Hardhat node:

```bash
npx hardhat node
```

2. In a new terminal, deploy the contracts:

```bash
npm run deploy:local
```

This will:
- Deploy the OracleConnector contract
- Deploy the FlightInsurance contract
- Generate a `deployment-localhost.json` file with contract addresses

### Testnet Deployment

For testnet deployment (Sepolia or Mumbai):

1. Ensure your `.env` file has the correct network and API endpoints.

2. Deploy to Sepolia:

```bash
npm run deploy:sepolia
```

Or deploy to Mumbai:

```bash
npm run deploy:mumbai
```

### Mainnet Deployment

For production deployment to Ethereum or Polygon mainnet:

1. **IMPORTANT**: Double-check your contract settings and ensure they're configured correctly for production.

2. Use the deployment script:

```bash
./deploy.sh
```

3. Follow the interactive prompts to select the network and confirm deployment.

4. The script will:
   - Deploy the contracts
   - Verify them on Etherscan/Polygonscan
   - Update frontend configuration
   - Optionally build and deploy the frontend

## Frontend Deployment

After deploying the contracts:

1. Update the contract addresses in the frontend:

```bash
# If not already done by deploy.sh
cp deployment-{network}.json frontend/src/utils/contractAddresses.json
```

2. Build the frontend:

```bash
cd frontend
npm install
npm run build
```

3. Deploy to your hosting service of choice:

```bash
# Example for Vercel
vercel --prod
```

## Verifying Smart Contracts

The deployment scripts automatically attempt to verify contracts, but if needed:

```bash
# For Ethereum networks
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS CONSTRUCTOR_ARGS

# For Polygon networks
npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS CONSTRUCTOR_ARGS
```

## Post-Deployment Configuration

After deployment:

1. **Fund Oracle Connector with LINK tokens**: The OracleConnector contract needs LINK tokens to request data from Chainlink oracles.

```javascript
// Example using Hardhat script
const linkToken = await ethers.getContractAt("IERC20", "LINK_TOKEN_ADDRESS");
await linkToken.transfer("ORACLE_CONNECTOR_ADDRESS", ethers.utils.parseEther("10"));
```

2. **Test a full policy cycle**: Purchase a policy, simulate a flight delay, and test claim process.

3. **Monitor contract events**: Set up monitoring for contract events to track policy purchases, claims, etc.

## Troubleshooting

### Common Issues

1. **Transaction reverted**: Check that:
   - You have sufficient ETH/MATIC for gas
   - Your contract has sufficient LINK tokens
   - The contract parameters are within valid ranges

2. **Oracle not responding**: Verify that:
   - Oracle address and JobID are correct for the network
   - Contract has LINK tokens
   - Chainlink node is operational on the network

3. **Frontend can't connect to contracts**: Check:
   - Contract addresses are correct in `contractAddresses.json`
   - Network ID matches what the user's wallet is connected to
   - RPC endpoint is functioning properly

### Support Resources

- Check GitHub Issues for known problems
- Join our Discord community for help
- For oracle issues, refer to Chainlink documentation

---

For additional help, contact the development team or open an issue on the GitHub repository.