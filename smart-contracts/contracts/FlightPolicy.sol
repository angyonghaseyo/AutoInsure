// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FlightPolicy { 
    address immutable companyContract;

    // Enum representing current policy status
    enum PolicyStatus {
        Active,
        Expired,
        Claimed,
        Discontinued
    }

    // Struct representing a policy
    struct policy {
        uint policyId;                   // 1-based index representing this user's policy number
        uint256 numFlights;              // Number of flights added to this policy
        string[] flightNumbers;          // Flight numbers covered
        uint256[] departureTimes;        // Corresponding departure times
        uint256 creationDate;            // When the policy was created
        uint256 activeDuration;          // Policy coverage duration (in days)
        uint256 premium;                 // Premium paid in wei
        uint256 delayPayout;             // Payout per hour of delay in wei
        uint256 delayThreshold;          // Hours of delay required to trigger payout
        uint256 payoutToDate;            // Total payout so far
        uint256 maxPayout;               // Maximum payout for the policy
        address insured;                 // Policyholder
        address insurer;                 // Contract or company
        PolicyStatus status;             // Current status of the policy
    }

    uint256 public numPolicyTypes = 0;
    policy[] public policyTypes;                                // All policy templates (0-based)
    mapping(address => policy[]) public policyHolders;          // User address to list of policies

    constructor() {
        companyContract = msg.sender;
    }

    modifier companyOnly() {
        require(tx.origin == companyContract, "Policy, Only the owner can call this function");
        _;
    }

    /**
     * @dev Creates a new policy type template to be purchased by users.
     */
    function createPolicy(uint256 activeDuration, uint256 premium, uint256 delayPayout, uint256 delayThreshold, uint256 maxPayout) public companyOnly returns (uint256) {
        string[] memory flightNumbers;
        uint256[] memory departureTimes;

        policy memory newPolicy = policy({
            policyId: 0,
            numFlights: 0,
            flightNumbers: flightNumbers,
            departureTimes: departureTimes,
            creationDate: 0,
            activeDuration: activeDuration,
            premium: premium * 1 ether,
            delayPayout: delayPayout * 1 ether,
            delayThreshold: delayThreshold,
            payoutToDate: 0,
            maxPayout: maxPayout * 1 ether,
            insured: address(0),
            insurer: msg.sender,
            status: PolicyStatus.Active
        });

        policyTypes.push(newPolicy);
        numPolicyTypes += 1;
        return numPolicyTypes;
    }

    /**
     * @dev Marks an existing policy type as discontinued.
     */
    function deletePolicy(uint256 policyTypeId) public companyOnly {
        require(policyTypeId > 0 && policyTypeId <= numPolicyTypes, "Invalid policy type");
        policyTypes[policyTypeId - 1].status = PolicyStatus.Discontinued;
    }

    /**
     * @dev Allows a user to purchase a new policy based on an available policy type.
     */
    function purchasePolicy(uint256 policyType, string memory flightNumber, uint256 departureTime, address policyHolder) public returns (uint256) {
        require(policyType > 0 && policyType <= numPolicyTypes, "Invalid policy type");

        policy memory template = policyTypes[policyType - 1];
        require(template.status == PolicyStatus.Active, "This policy type is discontinued");

        string[] memory flightNumbers;
        flightNumbers[0] = flightNumber;

        uint256[] memory departureTimes;
        departureTimes[0] = departureTime;

        policy memory newPolicy = policy({
            policyId: policyHolders[policyHolder].length + 1,
            numFlights: 1,
            flightNumbers: flightNumbers,
            departureTimes: departureTimes,
            creationDate: block.timestamp,
            activeDuration: template.activeDuration,
            premium: template.premium,
            delayPayout: template.delayPayout,
            delayThreshold: template.delayThreshold,
            payoutToDate: 0,
            maxPayout: template.maxPayout,
            insured: policyHolder,
            insurer: msg.sender,
            status: PolicyStatus.Active
        });

        policyHolders[policyHolder].push(newPolicy);
        return newPolicy.policyId;
    }

    /**
     * @dev Adds another flight to an active policy owned by a user.
     */
    function addFlightDetails(string memory flightNumber, uint256 departureTime, address policyHolder, uint256 policyIndex) public companyOnly {
        require(policyIndex > 0, "Invalid policy index");
        policy storage currPolicy = policyHolders[policyHolder][policyIndex - 1];
        require(currPolicy.status == PolicyStatus.Active, "Policy has been claimed or has expired");

        currPolicy.numFlights += 1;
        currPolicy.flightNumbers.push(flightNumber);
        currPolicy.departureTimes.push(departureTime);
    }

    /**
     * @dev Retrieves all policies owned by a user. Automatically updates latest policy status.
     */
    function getPolicyOfInsured(address insured) public view returns (policy[] memory) {
        return policyHolders[insured];
    }

    /**
     * @dev Returns all policy templates offered by the company.
     */
    function getAllPolicyTypes() public view returns (policy[] memory) {
        return policyTypes;
    }

    /**
     * @dev Returns details of a single policy type by its index.
     */
    function getPolicyDetails(uint256 policyType) public view returns (policy memory) {
        require(policyType > 0 && policyType <= numPolicyTypes, "Invalid policy type");
        return policyTypes[policyType - 1];
    }

    /**
     * @dev Marks the latest policy of a user as claimed.
     */
    function markAsClaimed(address insured) public companyOnly {
        require(policyHolders[insured].length > 0, "No policies available");
        policy storage currPolicy = policyHolders[insured][policyHolders[insured].length - 1];
        currPolicy.status = PolicyStatus.Claimed;
    }

    /**
     * @dev Internal function to expire a policy if duration has passed.
     */
    function updatePolicyStatus(policy storage p) internal {
        if (p.status == PolicyStatus.Active && block.timestamp >= p.creationDate + (p.activeDuration * 1 days)) {
            p.status = PolicyStatus.Expired;
        }
    }
}
