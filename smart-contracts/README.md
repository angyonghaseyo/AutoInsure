# Flight Insurance Smart Contracts

This directory contains the smart contracts that power the decentralized flight and baggage insurance platform.

## Contract Architecture

The system consists of multiple contracts working together:

```
                             ┌─────────────────┐
                             │                 │
                             │     Insurer     │  ◄─── Main entry point
                             │                 │
                             └────────┬────────┘
                                      │
                                      │ manages
                                      ▼
           ┌─────────────────┐    ┌────────┐    ┌─────────────────┐
           │                 │    │        │    │                 │
           │  FlightPolicy   │◄───┤        ├───►│  BaggagePolicy  │
           │                 │    │        │    │                 │
           └────────┬────────┘    └────────┘    └────────┬────────┘
                    │                                    │
                    │                                    │
                    ▼                                    ▼
           ┌─────────────────┐                  ┌─────────────────┐
           │                 │                  │                 │
           │ OracleConnector │                  │ OracleConnector │
           │                 │                  │                 │
           └────────┬────────┘                  └────────┬────────┘
                    │                                    │
                    │                                    │
                    ▼                                    ▼
           ┌─────────────────┐                  ┌─────────────────┐
           │                 │                  │                 │
           │  Chainlink      │                  │  Chainlink      │
           │  Oracles        │                  │  Oracles        │
           └─────────────────┘                  └─────────────────┘
```

## Contract Overview

### Insurer.sol

The main entry point contract that ties everything together. It handles:
- Template management (creating and managing insurance policy templates)
- Fund management (deposits and withdrawals)
- Policy purchase flows
- Claim verification and payouts
- Role management for insurers vs users

### FlightPolicy.sol

Manages flight delay insurance policies:
- Stores policy templates and user policies
- Handles the purchase of flight insurance policies
- Processes claims for flight delays based on oracle data
- Calculates payouts based on delay duration

### BaggagePolicy.sol

Manages baggage loss/damage insurance policies:
- Stores baggage policy templates and user policies
- Processes the purchase of baggage insurance
- Verifies baggage loss/damage claims using oracle data
- Determines payout eligibility

### OracleConnector.sol

Connects the insurance system to external data via Chainlink:
- Requests flight data from multiple oracles for redundancy
- Aggregates data from multiple sources to ensure accuracy
- Manages flight delay status determination
- Handles baggage status verification

### MockOracle.sol and MockLinkToken.sol

Test implementations for local development:
- Simulates Chainlink oracle functionality
- Provides test LINK tokens for oracle requests
- Used for testing the system without real blockchain oracles

## Policy Template Structure

### Flight Policy Template
```solidity
struct PolicyTemplate {
    string templateId;              // Unique identifier
    string name;                    // Display name
    string description;             // Description of coverage
    uint256 createdAt;              // Creation timestamp
    uint256 updatedAt;              // Last update timestamp 
    uint256 premium;                // Cost in ETH
    uint256 payoutPerHour;          // Payout rate per hour of delay
    uint256 maxTotalPayout;         // Maximum possible payout
    uint256 delayThresholdHours;    // Minimum delay for payout
    uint256 coverageDurationSeconds;// Policy validity period
    PolicyTemplateStatus status;    // Active or Deactivated
}
```

### Baggage Policy Template
```solidity
struct PolicyTemplate {
    string templateId;                // Unique identifier
    string name;                      // Display name
    string description;               // Description of coverage
    uint256 createdAt;                // Creation timestamp
    uint256 updatedAt;                // Last update timestamp
    uint256 premium;                  // Cost in ETH
    uint256 maxTotalPayout;           // Maximum payout
    uint256 coverageDurationSeconds;  // Policy validity period
    PolicyTemplateStatus status;      // Active or Deactivated
}
```

## Deployment

The contracts are deployed in a specific order to establish the correct dependencies:

1. **MockLinkToken** - A test LINK token for local development
2. **MockOracle** - Test oracles for development environments
3. **OracleConnector** - Interface between the insurance system and external data
4. **FlightPolicy** - Flight insurance policy contract
5. **BaggagePolicy** - Baggage insurance policy contract
6. **Insurer** - Main contract that coordinates the entire system

## Oracle System

The system uses Chainlink oracles to fetch external data:

1. When a claim is initiated, the smart contract requests data from the OracleConnector
2. The OracleConnector makes a request to multiple Chainlink oracles for redundancy
3. Oracle nodes run the external adapter (listener.js) to fetch data from flight APIs
4. The oracle nodes return the data on-chain
5. Multiple oracle responses are aggregated to determine the final status
6. The insurance contract uses this data to authorize or reject the claim

## Running Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/FlightPolicy.test.js

# Run tests with coverage report
npx hardhat coverage
```

## Security Considerations

- The contracts implement reentrancy protection for all payout functions
- Role-based access control restricts certain functions to the insurer
- Fund management ensures the contract always maintains sufficient balance for potential payouts
- Multiple oracle sources are used to avoid single points of failure

## Future Improvements

- Implement more sophisticated fund management with dynamic premiums
- Add support for more insurance types (hotel, event cancellation, etc.)
- Implement governance mechanism for policy template management
- Integrate with additional oracle networks for more data sources