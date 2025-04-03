// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FlightPolicy {
    address public immutable insurerAddress;

    constructor() {
        insurerAddress = msg.sender;
    }

    modifier onlyInsurer() {
        require(tx.origin == insurerAddress, "FlightPolicy: Only the insurer can call this function");
        _;
    }

    enum PolicyTemplateStatus {
        Active,
        Deactivated
    }

    struct PolicyTemplate {
        string templateId;              // Unique identifier for the template
        string name;                    // Display name for the policy (e.g., "Economy Plan")
        string description;             // Description of the coverage, terms, or perks
        uint256 createdAt;              // Timestamp of creation
        uint256 updatedAt;              // Timestamp of last update
        uint256 premium;                // Cost of the policy (in wei)
        uint256 payoutPerHour;          // Payout per hour of delay (in wei)
        uint256 delayThresholdHours;    // Minimum delay required (in hours)
        uint256 maxTotalPayout;         // Maximum payout for this policy (in wei)
        uint256 coverageDurationDays;   // How long the policy is valid after purchase
        PolicyTemplateStatus status;    // Whether the template is active or deactivated
    }

    enum PolicyStatus {
        Active,
        Expired,
        Claimed
    }

    struct UserPolicy {
        uint256 policyId;               // Unique ID of the buyer's policy
        PolicyTemplate template;        // Policy template details
        string flightNumber;            // Airline flight number (e.g., "SQ322")
        string departureAirportCode;    // IATA code (e.g., "SIN")
        string arrivalAirportCode;      // IATA code (e.g., "LHR")
        uint256 departureTime;          // Scheduled departure timestamp (UTC)
        uint256 createdAt;              // Policy purchase timestamp
        uint256 payoutToDate;           // Total paid out so far (in wei)
        address buyer;                  // Address of the user
        PolicyStatus status;            // Active, Expired, or Claimed
    }

    // Buyer policy storage
    mapping(uint256 => UserPolicy) public userPolicies;
    mapping(address => uint256[]) public userPolicyIds;
    uint256 public nextUserPolicyId;

    // ====== Insurer Functions ======

    // View all purchased policies
    function getAllPolicies() external view onlyInsurer returns (UserPolicy[] memory) {
        uint256 count = nextUserPolicyId;
        UserPolicy[] memory results = new UserPolicy[](count);
        for (uint256 i = 0; i < count; i++) {
            results[i] = userPolicies[i];
        }
        return results;
    }

    function markPolicyAsClaimed(address buyer, uint256 policyId) external onlyInsurer {
        require(policyId < nextUserPolicyId, "Invalid policyId");
        require(userPolicies[policyId].buyer == buyer, "Policy doesn't belong to buyer");
        require(userPolicies[policyId].status == PolicyStatus.Active, "Policy is not active");

        userPolicies[policyId].status = PolicyStatus.Claimed;
    }
    
    function markPolicyAsExpired(uint256 policyId) external onlyInsurer {
        require(policyId < nextUserPolicyId, "Invalid policyId");
        
        UserPolicy storage policy = userPolicies[policyId];
        require(policy.status == PolicyStatus.Active, "Policy is not active");

        uint256 expiryTime = policy.createdAt + (policy.template.coverageDurationDays * 1 days);

        require(block.timestamp > expiryTime, "Policy has not expired yet");

        policy.status = PolicyStatus.Expired;
    }

    function getUserPoliciesByTemplate(string memory templateId) external view returns (UserPolicy[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextUserPolicyId; i++) {
            
            if ( keccak256(abi.encodePacked(userPolicies[i].template.templateId)) == keccak256(abi.encodePacked(templateId))) {
                count++;
            }
        }
        UserPolicy[] memory result = new UserPolicy[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < nextUserPolicyId; i++) {
            if (keccak256(abi.encodePacked(userPolicies[i].template.templateId)) == keccak256(abi.encodePacked(templateId))) {
                result[j] = userPolicies[i];
                j++;
            }
        }
        return result;
    }


    // ====== User Functions ======
    // Purchase a policy based on a template
    function purchasePolicy(PolicyTemplate memory template, string memory flightNumber, string memory departureAirportCode, string memory arrivalAirportCode, uint256 departureTime, address buyer) external payable returns (uint256) {
        require(template.status == PolicyTemplateStatus.Active, "Policy template is not active");
        require(departureTime > block.timestamp, "Departure time must be in the future");
        require(msg.value >= template.premium, "Insufficient premium sent");

        uint256 policyId = nextUserPolicyId++;
        userPolicies[policyId] = UserPolicy({
            policyId: policyId,
            template: template,
            flightNumber: flightNumber,
            departureAirportCode: departureAirportCode,
            arrivalAirportCode: arrivalAirportCode,
            departureTime: departureTime,
            createdAt: block.timestamp,
            payoutToDate: 0,
            buyer: buyer,
            status: PolicyStatus.Active
        });

        userPolicyIds[buyer].push(policyId);
        return policyId;
    }

    // Get all policies owned by a user
    function getUserPolicies(address user) external view returns (UserPolicy[] memory) {
        uint256 count = userPolicyIds[user].length;
        UserPolicy[] memory results = new UserPolicy[](count);
        for (uint256 i = 0; i < count; i++) {
            results[i] = userPolicies[userPolicyIds[user][i]];
        }
        return results;
    }

    // Get a user's policy and its associated template
    function getUserPolicyWithTemplate(address user, uint256 policyId) external view returns (UserPolicy memory, PolicyTemplate memory) {
        require(policyId < nextUserPolicyId, "Invalid policyId");
        require(userPolicies[policyId].buyer == user, "Not your policy");
        UserPolicy memory userPolicy = userPolicies[policyId];
        return (userPolicy, userPolicy.template);
    }
}
