# Decentralized Flight Insurance Platform

A blockchain-based platform for flight delay insurance with automatic payouts powered by Chainlink oracles.

## Project Overview

This decentralized flight insurance platform allows travelers to purchase insurance policies for flight delays. If a flight is delayed beyond a certain threshold (default: 2 hours), the smart contract automatically processes a payout to the insured's wallet without requiring any manual claims process.

### Key Features

- **Decentralized Insurance Policies**: Purchase flight delay insurance with cryptocurrency
- **Automatic Payouts**: Smart contracts automatically execute payouts for delayed flights
- **Oracle Integration**: Chainlink oracles fetch reliable flight data from external APIs
- **Transparent Process**: All policies and claims are recorded on the blockchain
- **User-friendly Interface**: React-based frontend with Web3 wallet integration

## Architecture

The platform consists of three main components:

1. **Frontend (dApp)**: React application with Web3.js integration for wallet connection and contract interaction
2. **Smart Contracts**: Solidity contracts deployed on Ethereum/EVM-compatible blockchains
3. **Oracle Layer**: Chainlink oracles that fetch and verify flight data

## Project Structure

```
├── contracts/                # Smart contracts
│   ├── FlightInsurance.sol   # Main insurance contract
│   └── OracleConnector.sol   # Oracle integration contract
├── scripts/                  # Deployment and interaction scripts
│   ├── deploy.js             # Contract deployment script  
│   └── interact.js           # Contract interaction script
├── test/                     # Test files
│   └── FlightInsurance.test.js # Contract tests
├── frontend/                 # React frontend application
│   ├── src/                  # Source files
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   └── utils/            # Utility functions and constants
├── hardhat.config.js         # Hardhat configuration
└── README.md                 # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- MetaMask or another Web3 wallet
- Hardhat for development and testing

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/flight-insurance-dapp.git
cd flight-insurance-dapp
```

2. Install dependencies
```bash
# Install smart contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

3. Configure environment variables
```bash
# Create .env file in the root directory
cp .env.example .env
```

Edit the `.env` file with your configuration:
```
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=your_sepolia_rpc_url
ETHERSCAN_API_KEY=your_etherscan_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

### Smart Contract Deployment

1. Compile the contracts
```bash
npx hardhat compile
```

2. Deploy to local network for testing
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

3. Deploy to testnet (Sepolia)
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Frontend Development

1. Update contract addresses
```bash
# After deployment, update the contract addresses in frontend/src/utils/contractAddresses.json
```

2. Start the development server
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Testing

Run the test suite with Hardhat:
```bash
npx hardhat test
```

## User Flow

1. User connects their wallet to the dApp
2. User enters flight details and purchases an insurance policy by paying a premium
3. The smart contract stores the policy details on the blockchain
4. Chainlink oracles monitor the flight status using external API data
5. If the flight is delayed beyond the threshold, the smart contract automatically transfers the payout to the user's wallet

## Technical Implementation

### Smart Contracts

- **FlightInsurance.sol**: Manages policy creation, premium collection, and payout distribution
- **OracleConnector.sol**: Interfaces with Chainlink oracles to fetch flight status data

### Oracle Integration

The platform uses Chainlink oracles to:
1. Fetch flight data from external APIs like FlightAware or AviationStack
2. Verify flight delays and report the data on-chain
3. Trigger smart contract functions based on delay conditions

### Frontend

- React with Next.js for the UI
- Web3.js for blockchain interaction
- MetaMask/WalletConnect for wallet integration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is provided for educational and demonstration purposes only. It is not intended for use in production environments without proper security audits and testing.