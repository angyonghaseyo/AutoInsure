# Flight Insurance dApp Architecture

This document provides a detailed overview of the architecture for the decentralized flight insurance platform.

## Architecture Overview

The platform consists of three main layers:

1. **Frontend Layer**: User interface for interacting with the system
2. **Blockchain Layer**: Smart contracts that handle policy creation, payment, and claims
3. **Oracle Layer**: Chainlink oracles that fetch flight data from external sources

```
                       +---------------------------------+
                       |         Frontend (dApp)        |
                       |  React (Next.js) + Web3.js     |
                       |  User connects via MetaMask    |
                       |  Buys insurance via contract   |
                       +---------------------------------+
                                  |  ▲
                                  |  |
                                  v  |
                      +---------------------------+
                      |   Web3 Authentication      |
                      | (WalletConnect, MetaMask) |
                      +---------------------------+
                                  |  |
                                  v  v
      +--------------------------------------------------+
      |               Blockchain Layer (EVM)            |
      | +--------------------------------------------+  |
      | | Smart Contracts (Solidity)                |  |
      | | - Policy Purchase & Storage               |  |
      | | - Automatic Payout Logic                  |  |
      | | - Oracle Integration (Flight Data)        |  |
      | +--------------------------------------------+  |
      |         ▲                   |                  |
      |         |                   v                  |
      | +--------------------------------------------+  |
      | | Chainlink Oracle (Flight Status Fetch)    |  |
      | | - Fetches flight data from airline APIs   |  |
      | | - Reports to the smart contract          |  |
      | +--------------------------------------------+  |
      +--------------------------------------------------+
```

## Component Breakdown

### A. Frontend (React + Web3.js)

The frontend is a React application that provides a user interface for:

1. **User Authentication**:
   - Users connect their Ethereum wallets (MetaMask, WalletConnect)
   - Account address used for policy purchases and claims

2. **Policy Purchase**:
   - Users enter flight details (flight number, departure time)
   - Submit transactions to purchase insurance policies

3. **Policy Management**:
   - View purchased policies
   - Check policy status
   - Claim policy payouts

4. **Components**:
   - `Web3Provider.tsx`: Context provider for Web3 connectivity
   - `WalletConnect.tsx`: Wallet connection component
   - `PurchasePolicy.tsx`: Policy purchase form
   - `ViewPolicy.tsx`: Display and manage individual policies
   - `ClaimStatus.tsx`: View and process policy claims

### B. Blockchain Layer (Solidity Smart Contracts)

The blockchain layer consists of two main smart contracts:

1. **FlightInsurance.sol**:
   - Manages insurance policies
   - Handles premium payments
   - Processes claims and payouts
   - Key functions:
     - `purchasePolicy()`: Create new insurance policy
     - `claimPolicy()`: Claim payout for delayed flights
     - `cancelPolicy()`: Cancel policy before departure
     - `getPoliciesByUser()`: View user policies

2. **OracleConnector.sol**:
   - Interfaces with Chainlink oracles
   - Requests and receives flight data
   - Key functions:
     - `requestFlightData()`: Request flight status
     - `fulfillFlightData()`: Callback for oracle response
     - `getFlightStatus()`: Get flight delay information

### C. Oracle Layer (Chainlink)

The oracle layer uses Chainlink to:

1. **Fetch Flight Data**:
   - Connect to external flight data APIs
   - Verify flight delays
   - Report data back to the smart contract

2. **Trigger Payouts**:
   - Automatically identify when flights are delayed beyond threshold
   - Provide reliable, tamper-proof data for claims processing

## Data Flow

The system follows this process flow:

1. **User Buys Insurance**:
   - User connects wallet to dApp
   - Enters flight details and submits transaction
   - Smart contract stores policy data

2. **Flight Monitoring**:
   - Smart contract uses Chainlink to monitor flight status
   - Chainlink node fetches data from airline APIs
   - Flight status is pushed back to the smart contract

3. **Automatic Payout**:
   - When a flight delay is detected, the smart contract processes the payout
   - User receives funds automatically to their wallet

4. **User Interface Updates**:
   - Frontend keeps users informed about policy status
   - Shows flight information and claim eligibility

## Security Considerations

1. **Reentrancy Protection**:
   - All fund transfers use the checks-effects-interactions pattern
   - ReentrancyGuard modifier applied to critical functions

2. **Access Control**:
   - Ownable contract with admin functions restricted
   - User-specific policy operations validated by address

3. **Oracle Security**:
   - Multiple Chainlink nodes can be used for data verification
   - Data is cryptographically signed by oracle operators

4. **Error Handling**:
   - Comprehensive error checking and reverting with clear messages
   - Graceful failure modes to preserve funds

## Scalability Considerations

1. **Gas Optimization**:
   - Efficient data storage to minimize gas costs
   - Batch operations where possible

2. **Multi-chain Support**:
   - Architecture supports deployment on multiple EVM chains
   - Configuration based on network ID

3. **Frontend Performance**:
   - React optimizations for responsive UI
   - Caching of blockchain data to reduce RPC calls

## Future Extensions

1. **Multi-token Support**:
   - Accept premium payments in stablecoins
   - Allow users to choose payout currency

2. **Expanded Coverage**:
   - Add support for other travel disruptions
   - Include baggage loss and other travel incidents

3. **DAO Governance**:
   - Community governance for protocol parameters
   - Decentralized risk pool management

4. **Enhanced Analytics**:
   - Risk modeling based on historical flight data
   - Dynamic premium pricing