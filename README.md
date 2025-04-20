# Decentralized Flight Insurance Platform

A blockchain-based platform for flight delay and baggage insurance with automatic payouts powered by Chainlink oracles.

## Project Overview

This decentralized flight insurance platform allows travelers to purchase insurance policies for flight delays and baggage loss. If a flight is delayed beyond a certain threshold or baggage is reported lost, the smart contract automatically processes a payout to the insured's wallet without requiring any manual claims process.

### Key Features

- **Decentralized Insurance Policies**: Purchase flight delay and baggage loss insurance with cryptocurrency (ETH)
- **Automatic Payouts**: Smart contracts automatically execute payouts for delayed flights or lost baggage
- **Oracle Integration**: Chainlink oracles fetch reliable flight and baggage data from external APIs
- **Transparent Process**: All policies and claims are recorded on the blockchain
- **User-friendly Interface**: React-based dapp with Web3 wallet integration
- **Role-based Access**: Different interfaces for regular users and insurance providers
- **Policy Templates**: Customizable insurance templates with various premiums and payout rates

## System Architecture

The platform consists of three main components:

1. **Smart Contracts**: Solidity contracts deployed on Ethereum/EVM-compatible blockchains
2. **Oracle Layer**: Chainlink oracles that fetch and verify flight and baggage data
3. **Frontend Application**: React/Next.js application with Web3 integration for wallet connection and contract interaction

### Architecture Diagram

```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│                 │          │                 │          │                 │
│  React Frontend │◄────────►│ Smart Contracts │◄────────►│ Chainlink Oracle│
│                 │          │                 │          │                 │
└─────────────────┘          └─────────────────┘          └─────────────────┘
        ▲                            ▲                            ▲
        │                            │                            │
        ▼                            ▼                            ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│                 │          │                 │          │                 │
│   Web3 Wallet   │          │ Ethereum Network│          │   External APIs │
│                 │          │                 │          │ (Flight/Baggage)│
└─────────────────┘          └─────────────────┘          └─────────────────┘
```

## Project Structure

```
├── contracts/                # Smart contracts
│   ├── FlightPolicy.sol      # Flight insurance logic
│   ├── BaggagePolicy.sol     # Baggage insurance logic
│   ├── Insurer.sol           # Main contract for policy management
│   ├── MockLinkToken.sol     # LINK Token
│   ├── MockOracle.sol        # Oracle
│   └── OracleConnector.sol   # Oracle integration
├── listener/                 # Oracle listener service
│   └── listener.js           # Node.js script for oracle data
├── scripts/                  # Deployment and interaction scripts
│   └── deploy.js             # Contract deployment script
├── test/                     # Test files
│   └── *.test.js             # Contract tests
├── dapp/                     # React dapp application
│   ├── src/                  # Source files
│   │   ├── backend/          # Backend logic to connect to MongoDB
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── types/            # Types and interfaces
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
git clone https://github.com/angyonghaseyo/AutoInsure.git
cd AutoInsure
```

2. Install dependencies

```bash
# Install smart contract dependencies
npm install

# Install dapp dependencies
cd dapp
npm install
```

3. Configure environment variables for contracts

```bash
# Create .env file in the smart-contracts directory
cp .env.example .env
```

Edit the `.env` file with your configuration:

```
PRIVATE_KEY=your_private_key
ETHEREUM_SEPOLIA_URL=your_ethereum_sepolia_url
ETHEREUM_MAINNET_URL=your_ethereum_mainnet_url
```

4. Configure environment variables for frontend

```bash
# Create .env.local file in the dapp directory
cd dapp
cp .env.example .env.local
```

Edit the `.env.local` file:

```
MONGODB_URI=your_mongodb_uri
MONGODB_DB=your_mongodb_database
```

## Smart Contract Deployment

1. Compile the contracts

```bash
npx hardhat compile
```

2. Deploy to local network

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## Frontend Deployment

1. Start the development server

```bash
cd dapp
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

## Testing

Run the test suite with Hardhat:

```bash
npx hardhat node
npx hardhat test --network localhost
```

## User Flow

### User Flow

1. User connects their wallet to the dApp
2. User browses flight or baggage insurance policy templates
3. User purchases a policy by paying a premium
4. If a flight is delayed or baggage is lost:
   - Chainlink oracles fetch data from external sources
   - Smart contract automatically verifies the claim
   - If verified, funds are transferred to the user's wallet

### Insurer Flow

1. Insurer connects to the platform with their wallet
2. Insurer creates and manages policy templates
3. Insurer deposits funds to cover potential claims
4. Insurer monitors active policies and claim statistics

## Technical Implementation

### Smart Contracts

- **FlightPolicy.sol**: Manages flight delay insurance policies, claims verification, and payout calculation
- **BaggagePolicy.sol**: Handles baggage loss insurance, claim verification, and payouts
- **Insurer.sol**: Main entry point for policy creation, fund management, and template administration
- **OracleConnector.sol**: Interfaces with Chainlink oracles to fetch flight and baggage status data

### Oracle Integration

The platform uses Chainlink oracles to:

1. Fetch flight data from external APIs to verify flight delays
2. Obtain baggage status information to verify loss claims
3. Trigger smart contract functions based on the verification results

### Frontend Application

- React with Next.js for the UI
- Web3.js and ethers.js for blockchain interaction
- MongoDB for policy template storage
- Role-based UI for users and insurers
