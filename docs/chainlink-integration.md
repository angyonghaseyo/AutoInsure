# Chainlink Oracle Integration Guide

This document explains how to set up and integrate Chainlink oracles with the flight insurance platform.

## Overview

The flight insurance platform uses Chainlink oracles to obtain reliable flight data from external sources. This data is crucial for determining if a flight is delayed and whether a policy payout should be triggered.

## Chainlink Components

The platform uses the following Chainlink components:

1. **Chainlink Nodes**: Decentralized oracle network that fetches external data
2. **Job IDs**: Specific tasks configured on Chainlink nodes
3. **LINK Token**: Used to pay for oracle services
4. **External Adapters**: Custom integrations with flight data APIs

## Implementation in OracleConnector.sol

The `OracleConnector.sol` contract implements Chainlink's `ChainlinkClient` interface to request and receive flight data:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
// Other imports...

contract OracleConnector is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;
    
    // Oracle parameters
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    
    // Flight data storage
    struct FlightData {
        string flightNumber;
        uint256 departureTime;
        bool isDelayed;
        uint256 delayMinutes;
        bool dataReceived;
    }
    
    // Mappings for storage...
    
    // Events...
    
    constructor() Ownable(msg.sender) {
        setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789); // Sepolia LINK
        oracle = 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD; // Example oracle address
        jobId = "7d80a6386ef543a3abb52817f6707e3b"; // Example job ID
        fee = 0.1 * 10 ** 18; // 0.1 LINK
    }
    
    // Request flight data from Chainlink oracle
    function requestFlightData(string memory _flightNumber, uint256 _departureTime) 
        public
        returns (bytes32 requestId) 
    {
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillFlightData.selector
        );
        
        // Set the URL to fetch flight data
        request.add("get", string(abi.encodePacked(
            "https://api.flightdata.example/flight/",
            _flightNumber,
            "?departure=",
            uint2str(_departureTime)
        )));
        
        // Set the path to find the flight delay data
        request.add("path", "data,isDelayed");
        request.add("path", "data,delayMinutes");
        
        // Send the request
        requestId = sendChainlinkRequestTo(oracle, request, fee);
        
        // Store request mapping
        requestToFlightNumber[requestId] = _flightNumber;
        requestToDepartureTime[requestId] = _departureTime;
        
        emit FlightDataRequested(requestId, _flightNumber, _departureTime);
        
        return requestId;
    }
    
    // Callback function for Chainlink oracle response
    function fulfillFlightData(
        bytes32 _requestId,
        bool _isDelayed,
        uint256 _delayMinutes
    ) 
        public
        recordChainlinkFulfillment(_requestId)
    {
        // Store flight data
        // ...
    }
    
    // Other functions...
}
```

## Setting Up Chainlink Oracle

### Step 1: Set Up a Chainlink Node

For production, you'll need to:
1. Run a Chainlink node or use a node service provider
2. Configure the node with the required external adapters
3. Create a job for flight data fetching

For development/testing, you can use:
- Public test nodes on Sepolia/Mumbai testnets
- Mock responses for local testing

### Step 2: Create External Adapter

For flight data, you'll need to create an external adapter that:
1. Connects to flight data APIs (such as FlightAware, AviationStack, etc.)
2. Parses the response to extract delay information
3. Returns data in the format expected by the smart contract

Example adapter in JavaScript:

```javascript
const { Requester, Validator } = require('@chainlink/external-adapter');

// Define custom error messages
const customError = (data) => {
  if (data.Response === 'Error') return true;
  return false;
};

// Define data source and endpoint config
const createRequest = (input, callback) => {
  // The flight number and departure time from the request
  const flightNumber = input.data.flightNumber;
  const departureTime = input.data.departureTime;
  
  // API endpoint and parameters
  const url = `https://api.flightdata.example/flight/${flightNumber}`;
  const params = {
    departure: departureTime,
    apikey: process.env.FLIGHT_API_KEY
  };

  // Data source request config
  const config = {
    url,
    params
  };

  // Process API response
  Requester.request(config)
    .then(response => {
      // Parse and format the response data
      const isDelayed = response.data.status === 'DELAYED';
      const scheduledTime = new Date(response.data.scheduledDeparture).getTime() / 1000;
      const actualTime = new Date(response.data.actualDeparture).getTime() / 1000;
      const delayMinutes = isDelayed ? Math.floor((actualTime - scheduledTime) / 60) : 0;
      
      // Return data in required format
      response.data.result = {
        isDelayed: isDelayed,
        delayMinutes: delayMinutes
      };
      
      callback(response.status, Requester.success(input.id, response.data));
    })
    .catch(error => {
      callback(500, Requester.errored(input.id, error));
    });
};

// Create the external adapter
module.exports.createRequest = createRequest;
```

### Step 3: Configure Chainlink Job

Define a job in the Chainlink node that:
1. Accepts HTTP requests with flight information
2. Calls the external adapter
3. Returns the response to the requesting contract

Example job specification:

```json
{
  "name": "Flight Data Oracle",
  "initiators": [
    {
      "type": "runlog",
      "params": {
        "address": "YOUR_ORACLE_CONTRACT_ADDRESS"
      }
    }
  ],
  "tasks": [
    {
      "type": "flightdata",
      "params": {
        "endpoint": "flight"
      }
    },
    {
      "type": "copy",
      "params": {
        "copyPath": ["result", "isDelayed"]
      }
    },
    {
      "type": "copy",
      "params": {
        "copyPath": ["result", "delayMinutes"]
      }
    },
    {
      "type": "ethuint256",
      "params": {
        "index": 1
      }
    },
    {
      "type": "ethtx"
    }
  ]
}
```

### Step 4: Fund Oracle with LINK Token

Ensure the OracleConnector contract has sufficient LINK tokens to make oracle requests:

1. Transfer LINK to the contract address
2. For testnets, use faucets to get test LINK tokens

## Testing the Oracle Integration

### Local Testing

1. Use Hardhat's forking capability to simulate mainnet/testnet
2. Mock Chainlink responses for deterministic testing
3. Test various flight scenarios (on-time, delayed, cancelled)

Example test:

```javascript
describe("Oracle Integration", function () {
  it("Should handle flight status requests and responses", async function () {
    // Mock oracle response
    const mockFulfillFunctionSelector = ethers.utils.id("fulfillFlightData(bytes32,bool,uint256)").slice(0, 10);
    const mockResponseData = ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "bool", "uint256"],
      [requestId, true, 150] // 150 minutes delay
    );
    
    // Send mock response to contract
    await mockOracle.fulfillOracleRequest(
      requestId,
      fee,
      oracleConnector.address,
      mockFulfillFunctionSelector,
      0,
      mockResponseData
    );
    
    // Check if data is stored correctly
    const flightData = await oracleConnector.getCachedFlightData("AA123", departureTime);
    expect(flightData.isDelayed).to.equal(true);
    expect(flightData.delayMinutes).to.equal(150);
  });
});
```

### Testnet Testing

1. Deploy to a testnet (Sepolia, Mumbai)
2. Use real Chainlink nodes with test flight data
3. Monitor requests and responses via Chainlink Explorer

## Production Considerations

### Oracle Redundancy

Use multiple Chainlink nodes to improve reliability:
1. Request data from multiple nodes
2. Use an aggregation pattern to confirm data across sources
3. Implement a fallback mechanism

### Cost Optimization

Optimize LINK token usage:
1. Cache flight data to avoid duplicate requests
2. Request data only when needed (e.g., near departure time)
3. Use batch requests where possible

### Data Quality

Ensure data quality by:
1. Selecting reliable flight data providers
2. Implementing data validation in the external adapter
3. Setting up monitoring for inconsistent data

## Supported Flight Data APIs

The following flight data APIs can be integrated:

1. **FlightAware FlightXML API**
   - Comprehensive flight tracking
   - Global coverage
   - Real-time updates

2. **AviationStack API**
   - Historical and real-time flight data
   - Delay information
   - Simplified integration

3. **FlightStats API**
   - Detailed status information
   - Delay predictions
   - Airport and airline data

Each API requires specific formatting in the external adapter.

## Troubleshooting

Common issues and solutions:

1. **Oracle not responding**
   - Check LINK token balance
   - Verify oracle address and job ID
   - Ensure the node is operational

2. **Incorrect flight data**
   - Debug external adapter
   - Verify API credentials
   - Check data parsing logic

3. **High gas costs**
   - Optimize request frequency
   - Use batching where possible
   - Consider alternative chains with lower fees