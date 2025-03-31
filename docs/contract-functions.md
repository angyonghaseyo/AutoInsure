
# Smart Contract Function Documentation

## FlightPolicy.sol

The `FlightPolicy` contract handles the core logic for managing flight insurance templates and user policies.

---

### Data Structures

#### PolicyTemplateStatus Enum

```solidity
enum PolicyTemplateStatus {
    Active,
    Deactivated
}
```

#### PolicyStatus Enum

```solidity
enum PolicyStatus {
    Active,
    Expired,
    Claimed
}
```

#### PolicyTemplate Struct

```solidity
struct PolicyTemplate {
    uint256 templateId;
    string name;
    string description;
    uint256 createdAt;
    uint256 premium;
    uint256 payoutPerHour;
    uint256 delayThresholdHours;
    uint256 maxTotalPayout;
    uint256 coverageDurationDays;
    PolicyTemplateStatus status;
}
```

#### UserPolicy Struct

```solidity
struct UserPolicy {
    uint256 policyId;
    uint256 templateId;
    string flightNumber;
    string departureAirportCode;
    string arrivalAirportCode;
    uint256 departureTime;
    uint256 createdAt;
    uint256 payoutToDate;
    address buyer;
    PolicyStatus status;
}
```

---

### Public Functions

#### `createPolicyTemplate(...)`

Creates a new insurance policy template.

```solidity
function createPolicyTemplate(...) external onlyInsurer returns (uint256)
```

#### `deactivatePolicyTemplate(uint256 templateId)`

Deactivates an existing template.

```solidity
function deactivatePolicyTemplate(uint256 templateId) external onlyInsurer
```

#### `getAllPolicyTemplates()`

Returns all policy templates.

```solidity
function getAllPolicyTemplates() external view returns (PolicyTemplate[])
```

#### `getPolicyTemplateById(uint256 templateId)`

Returns a single policy template.

```solidity
function getPolicyTemplateById(uint256 templateId) external view returns (PolicyTemplate)
```

#### `purchasePolicy(...)`

Purchases a policy based on a template.

```solidity
function purchasePolicy(...) external payable returns (uint256)
```

#### `getUserPolicies(address user)`

Returns all policies owned by the given user.

```solidity
function getUserPolicies(address user) external view returns (UserPolicy[])
```

#### `getUserPolicyWithTemplate(address user, uint256 policyId)`

Returns a specific user policy with its associated template.

```solidity
function getUserPolicyWithTemplate(...) external view returns (UserPolicy, PolicyTemplate)
```

#### `getActivePolicyTemplates()`

Returns all active policy templates.

```solidity
function getActivePolicyTemplates() external view returns (PolicyTemplate[])
```

#### `markPolicyAsClaimed(address buyer, uint256 policyId)`

Marks a policy as claimed (Only Insurer).

```solidity
function markPolicyAsClaimed(...) external onlyInsurer
```

#### `markPolicyAsExpired(uint256 policyId)`

Marks a policy as expired based on time.

```solidity
function markPolicyAsExpired(...) external onlyInsurer
```

---

## Insurer.sol

The `Insurer` contract acts as an administrative layer for managing policies and templates via the `FlightPolicy` contract.

---

### State

| Variable         | Type            | Description                                  |
|------------------|------------------|----------------------------------------------|
| `insurerAddress` | address          | The owner/insurer of the contract            |
| `flightPolicy`   | FlightPolicy     | Address of the linked `FlightPolicy` contract |

---

### Events

| Event                         | Parameters                                                  |
|-------------------------------|-------------------------------------------------------------|
| `FlightPolicyTemplateCreated` | `uint256 templateId, string name`                          |
| `FlightPolicyTemplateDeactivated` | `uint256 templateId`                                  |
| `FlightPolicyPurchased`       | `address buyer, uint256 policyId, uint256 templateId`       |

---

### Public Functions

#### Insurer Functions

##### `createFlightPolicyTemplate(...)`

Calls `FlightPolicy.createPolicyTemplate(...)`

##### `deactivateFlightPolicyTemplate(uint256 templateId)`

Calls `FlightPolicy.deactivatePolicyTemplate(...)`

##### `markFlightPolicyAsClaimed(address buyer, uint256 policyId)`

Marks a user's policy as claimed.

##### `markFlightPolicyAsExpired(uint256 policyId)`

Marks a user's policy as expired.

##### `withdraw(uint256 amountInWei)`

Transfers balance from the contract to the insurer.

---

#### User Functions

##### `purchaseFlightPolicy(...)`

Forwards the call to `FlightPolicy.purchasePolicy(...)`.

##### `getUserFlightPolicies(address user)`

Calls `FlightPolicy.getUserPolicies(...)`

##### `getFlightPolicyWithTemplate(address user, uint256 policyId)`

Calls `FlightPolicy.getUserPolicyWithTemplate(...)`

##### `getAllFlightPolicyTemplates()`

Calls `FlightPolicy.getAllPolicyTemplates()`

##### `getFlightPolicyTemplateById(uint256 templateId)`

Calls `FlightPolicy.getPolicyTemplateById(...)`

##### `getActiveFlightPolicyTemplates()`

Calls `FlightPolicy.getActivePolicyTemplates(...)`

---

#### Utility

##### `isInsurer(address user)`

Returns whether the user is the contract owner (insurer).
