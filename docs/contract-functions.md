# Smart Contract Function Documentation

This document provides detailed documentation for the functions in the FlightInsurance and OracleConnector smart contracts.

## FlightInsurance.sol

The FlightInsurance contract manages the core insurance functionality - policy creation, claim processing, and payouts.

### Data Structures

#### Policy Struct

```solidity
struct Policy {
    uint256 policyId;         // Unique identifier for the policy
    address policyholder;     // Address of the policy owner
    string flightNumber;      // Flight number (e.g., "AA123")
    uint256 departureTime;    // Unix timestamp of scheduled departure
    uint256 premium;          // Amount paid for the policy in wei
    uint256 payoutAmount;     // Amount to pay in case of delay in wei
    bool isPaid;              // Whether the policy has been paid out
    bool isClaimed;           // Whether the policy has been claimed
    uint256 delayThreshold;   // Minimum delay required for payout (in minutes)
    PolicyStatus status;      // Current policy status
}
```

#### PolicyStatus Enum

```solidity
enum PolicyStatus {
    Active,     // Policy is active and valid
    Expired,    // Policy has expired without being claimed
    Claimed,    // Policy has been claimed and paid out
    Cancelled   // Policy was cancelled by policyholder
}
```

### Public Variables

| Variable | Type | Description |
|----------|------|-------------|
| `minPremium` | uint256 | Minimum amount that can be paid as premium (default: 0.01 ETH) |
| `maxPayout` | uint256 | Maximum amount that can be paid out for a claim (default: 0.5 ETH) |
| `policyExpirationTime` | uint256 | Time after departure when policy expires (default: 24 hours) |
| `defaultDelayThreshold` | uint256 | Default minimum delay for payout eligibility (default: 120 minutes) |
| `oracleConnector` | OracleConnector | Reference to the oracle connector contract |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `PolicyPurchased` | uint256 policyId, address policyholder, string flightNumber, uint256 departureTime | Emitted when a new policy is purchased |
| `PolicyClaimed` | uint256 policyId, address policyholder, uint256 payoutAmount | Emitted when a policy is claimed and paid out |
| `PolicyCancelled` | uint256 policyId, address policyholder | Emitted when a policy is cancelled |
| `DelayThresholdUpdated` | uint256 newThreshold | Emitted when the default delay threshold is updated |
| `OracleConnectorUpdated` | address newConnector | Emitted when the oracle connector address is updated |

### Functions

#### Constructor

```solidity
constructor(address _oracleConnector) Ownable(msg.sender)
```

Initializes the contract with the oracle connector address.

**Parameters:**
- `_oracleConnector`: Address of the deployed OracleConnector contract

#### Purchase Policy

```solidity
function purchasePolicy(
    string memory _flightNumber, 
    uint256 _departureTime
) 
    external 
    payable 
    nonReentrant 
    returns (uint256)
```

Allows a user to purchase a flight delay insurance policy.

**Parameters:**
- `_flightNumber`: Flight number (e.g., "AA123")
- `_departureTime`: Unix timestamp of the scheduled departure time

**Requirements:**
- Premium must be >= `minPremium`
- Departure time must be in the future

**Returns:**
- `uint256`: ID of the newly created policy

**Behavior:**
1. Validates the premium amount and departure time
2. Calculates payout amount (3x premium, capped at maxPayout)
3. Creates a new policy with Active status
4. Adds the policy to the user's list of policies
5. Emits a PolicyPurchased event

#### Claim Policy

```solidity
function claimPolicy(uint256 _policyId) 
    external 
    nonReentrant 
    validPolicy(_policyId) 
    onlyPolicyholder(_policyId)
```

Allows a policyholder to claim a payout for a delayed flight.

**Parameters:**
- `_policyId`: ID of the policy to claim

**Requirements:**
- Policy must be active
- Policy must not be already paid out
- Policy must not be already claimed
- Policy must not be expired
- Flight must be delayed beyond the threshold according to oracle data

**Behavior:**
1. Validates policy status and eligibility
2. Requests flight status from oracle connector
3. Verifies that flight is sufficiently delayed
4. Marks policy as paid and claimed
5. Updates policy status to Claimed
6. Emits a PolicyClaimed event
7. Transfers payout amount to policyholder

#### Cancel Policy

```solidity
function cancelPolicy(uint256 _policyId) 
    external 
    nonReentrant 
    validPolicy(_policyId) 
    onlyPolicyholder(_policyId)
```

Allows a policyholder to cancel a policy before departure.

**Parameters:**
- `_policyId`: ID of the policy to cancel

**Requirements:**
- Policy must be active
- Policy must not be already paid out
- Policy must not be already claimed
- Current time must be before departure time

**Behavior:**
1. Validates policy status and eligibility
2. Calculates refund amount (50% of premium)
3. Updates policy status to Cancelled
4. Emits a PolicyCancelled event
5. Transfers refund amount to policyholder

#### Get Policies By User

```solidity
function getPoliciesByUser(address _user) 
    external 
    view 
    returns (uint256[] memory)
```

Gets all policies purchased by a specific user.

**Parameters:**
- `_user`: Address of the user

**Returns:**
- Array of policy IDs owned by the user

#### Get Policy Details

```solidity
function getPolicyDetails(uint256 _policyId) 
    external 
    view 
    validPolicy(_policyId) 
    returns (Policy memory)
```

Gets detailed information about a specific policy.

**Parameters:**
- `_policyId`: ID of the policy

**Returns:**
- Policy struct containing all policy details

#### Update Delay Threshold

```solidity
function updateDelayThreshold(uint256 _newThreshold) 
    external 
    onlyOwner
```

Updates the default delay threshold for new policies.

**Parameters:**
- `_newThreshold`: New threshold in minutes

**Requirements:**
- Caller must be the contract owner

**Behavior:**
1. Updates the defaultDelayThreshold value
2. Emits a DelayThresholdUpdated event

#### Update Oracle Connector

```solidity
function updateOracleConnector(address _newConnector) 
    external 
    onlyOwner
```

Updates the oracle connector address.

**Parameters:**
- `_newConnector`: Address of the new oracle connector

**Requirements:**
- Caller must be the contract owner

**Behavior:**
1. Updates the oracleConnector reference
2. Emits an OracleConnectorUpdated event

#### Withdraw Funds

```solidity
function withdrawFunds(uint256 _amount) 
    external 
    onlyOwner
```

Allows the owner to withdraw funds from the contract.

**Parameters:**
- `_amount`: Amount to withdraw in wei

**Requirements:**
- Caller must be the contract owner
- Amount must not exceed contract balance

**Behavior:**
1. Transfers the specified amount to the owner's address

---

## OracleConnector.sol

The OracleConnector contract interfaces with Chainlink oracles to fetch flight status data.

### Data Structures

#### FlightData Struct

```solidity
struct FlightData {
    string flightNumber;     // Flight number
    uint256 departureTime;   // Unix timestamp of scheduled departure
    bool isDelayed;          // Whether the flight is delayed
    uint256 delayMinutes;    // Minutes of delay
    bool dataReceived;       // Whether data has been received from oracle
}
```

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `FlightDataRequested` | bytes32 requestId, string flightNumber, uint256 departureTime | Emitted when flight data is requested from Chainlink |
| `FlightDataReceived` | bytes32 requestId, string flightNumber, uint256 departureTime, bool isDelayed, uint256 delayMinutes | Emitted when flight data is received from Chainlink |

### Functions

#### Constructor

```solidity
constructor() Ownable(msg.sender)
```

Initializes the Chainlink client with token address, oracle address, and job ID.

**Behavior:**
1. Sets the Chainlink token address for the relevant network
2. Sets default oracle address, job ID, and fee

#### Request Flight Data

```solidity
function requestFlightData(
    string memory _flightNumber, 
    uint256 _departureTime
) 
    public
    returns (bytes32 requestId)
```

Requests flight data from a Chainlink oracle.

**Parameters:**
- `_flightNumber`: Flight number (e.g., "AA123")
- `_departureTime`: Unix timestamp of scheduled departure

**Returns:**
- `bytes32`: Chainlink request ID

**Behavior:**
1. Builds a Chainlink request with the job ID and callback function
2. Adds flight API URL with flight number and departure time parameters
3. Adds path to parse the response JSON
4. Sends the request to the Chainlink node
5. Stores mapping of request ID to flight info
6. Emits a FlightDataRequested event

#### Fulfill Flight Data

```solidity
function fulfillFlightData(
    bytes32 _requestId,
    bool _isDelayed,
    uint256 _delayMinutes
) 
    public
    recordChainlinkFulfillment(_requestId)
```

Callback function that receives data from the Chainlink oracle.

**Parameters:**
- `_requestId`: Chainlink request ID
- `_isDelayed`: Whether the flight is delayed
- `_delayMinutes`: Minutes of delay

**Requirements:**
- Must be called by the Chainlink oracle

**Behavior:**
1. Retrieves flight number and departure time from request mapping
2. Stores flight data in the contract
3. Marks data as received
4. Emits a FlightDataReceived event

#### Get Flight Status

```solidity
function getFlightStatus(
    string memory _flightNumber, 
    uint256 _departureTime
)
    external
    returns (bool isDelayed, uint256 delayMinutes)
```

Gets flight status, making a new request if data is not already available.

**Parameters:**
- `_flightNumber`: Flight number
- `_departureTime`: Departure time

**Returns:**
- `isDelayed`: Whether the flight is delayed
- `delayMinutes`: Minutes of delay

**Behavior:**
1. Checks if flight data is already available
2. If available, returns cached data
3. If not available, makes a new request to Chainlink oracle
4. Returns default values while waiting for oracle response

#### Get Cached Flight Data

```solidity
function getCachedFlightData(
    string memory _flightNumber, 
    uint256 _departureTime
)
    external
    view
    returns (bool isDelayed, uint256 delayMinutes, bool dataReceived)
```

Gets cached flight data without making a new request.

**Parameters:**
- `_flightNumber`: Flight number
- `_departureTime`: Departure time

**Returns:**
- `isDelayed`: Whether the flight is delayed
- `delayMinutes`: Minutes of delay
- `dataReceived`: Whether data has been received from oracle

#### Update Oracle Parameters

```solidity
function updateOracleParams(
    address _oracle, 
    bytes32 _jobId, 
    uint256 _fee
)
    external
    onlyOwner
```

Updates Chainlink oracle parameters.

**Parameters:**
- `_oracle`: New oracle address
- `_jobId`: New job ID
- `_fee`: New fee amount

**Requirements:**
- Caller must be the contract owner

**Behavior:**
1. Updates oracle address, job ID, and fee

#### Withdraw Link

```solidity
function withdrawLink() external onlyOwner
```

Withdraws LINK tokens from the contract.

**Requirements:**
- Caller must be the contract owner

**Behavior:**
1. Transfers all LINK tokens from the contract to the owner