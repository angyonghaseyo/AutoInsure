// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FlightPolicy {
    address public immutable insurerAddress;

    constructor() {
        insurerAddress = msg.sender;
    }

    modifier onlyInsurer() {
        require(msg.sender == insurerAddress, "FlightPolicy: Only the insurer can call this function");
        _;
    }

    enum PolicyTemplateStatus {
        Active,
        Deactivated
    }

    struct PolicyTemplate {
        uint256 templateId;             // Unique identifier for the template
        string name;                    // Display name for the policy (e.g., "Economy Plan")
        string description;             // Description of the coverage, terms, or perks
        uint256 createdAt;              // Block timestamp of creation
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
        uint256 templateId;             // ID reference to PolicyTemplate used
        string flightNumber;            // Airline flight number (e.g., "SQ322")
        string departureAirportCode;    // IATA code (e.g., "SIN")
        string arrivalAirportCode;      // IATA code (e.g., "LHR")
        uint256 departureTime;          // Scheduled departure timestamp (UTC)
        uint256 createdAt;              // Policy purchase timestamp
        uint256 payoutToDate;           // Total paid out so far (in wei)
        address buyer;                  // Address of the user
        PolicyStatus status;            // Active, Expired, or Claimed
    }

    // Template storage
    mapping(uint256 => PolicyTemplate) public policyTemplates;
    uint256 public nextPolicyTemplateId;

    // Buyer policy storage
    mapping(uint256 => UserPolicy) public userPolicies;
    mapping(address => uint256[]) public userPolicyIds;
    uint256 public nextUserPolicyId;

    // ====== Insurer Functions ======
    // Create a new policy template
    function createPolicyTemplate(string memory name, string memory description, uint256 premium, uint256 payoutPerHour, uint256 delayThresholdHours, uint256 maxTotalPayout, uint256 coverageDurationDays) external onlyInsurer returns (uint256) {
        uint256 templateId = nextPolicyTemplateId;

        policyTemplates[templateId] = PolicyTemplate({
            templateId: templateId,
            name: name,
            description: description,
            createdAt: block.timestamp,
            premium: premium * 1 ether,
            payoutPerHour: payoutPerHour * 1 ether,
            delayThresholdHours: delayThresholdHours,
            maxTotalPayout: maxTotalPayout * 1 ether,
            coverageDurationDays: coverageDurationDays,
            status: PolicyTemplateStatus.Active
        });

        nextPolicyTemplateId++;
        return templateId;
    }

    // Soft-delete (deactivate) an existing policy template
    function deactivatePolicyTemplate(uint256 templateId) external onlyInsurer {
        require(templateId < nextPolicyTemplateId, "Invalid templateId");
        policyTemplates[templateId].status = PolicyTemplateStatus.Deactivated;
    }

    // View all policy templates (including deactivated)
    function getAllPolicyTemplates() external view returns (PolicyTemplate[] memory) {
        PolicyTemplate[] memory result = new PolicyTemplate[](nextPolicyTemplateId);
        for (uint256 i = 0; i < nextPolicyTemplateId; i++) {
            result[i] = policyTemplates[i];
        }
        return result;
    }

    // View a single policy template by ID
    function getPolicyTemplateById(uint256 templateId) external view returns (PolicyTemplate memory) {
        require(templateId < nextPolicyTemplateId, "Template does not exist");
        return policyTemplates[templateId];
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

        PolicyTemplate memory template = policyTemplates[policy.templateId];
        uint256 expiryTime = policy.createdAt + (template.coverageDurationDays * 1 days);

        require(block.timestamp > expiryTime, "Policy has not expired yet");

        policy.status = PolicyStatus.Expired;
    }


    // ====== User Functions ======
    // Purchase a policy based on a template
    function purchasePolicy(uint256 templateId, string memory flightNumber, string memory departureAirportCode, string memory arrivalAirportCode, uint256 departureTime) external payable returns (uint256) {
        require(templateId < nextPolicyTemplateId, "Invalid templateId");

        PolicyTemplate memory template = policyTemplates[templateId];
        require(template.status == PolicyTemplateStatus.Active, "Policy template is not active");
        require(departureTime > block.timestamp, "Departure time must be in the future");
        require(msg.value >= template.premium, "Insufficient premium sent");

        uint256 policyId = nextUserPolicyId++;
        userPolicies[policyId] = UserPolicy({
            policyId: policyId,
            templateId: templateId,
            flightNumber: flightNumber,
            departureAirportCode: departureAirportCode,
            arrivalAirportCode: arrivalAirportCode,
            departureTime: departureTime,
            createdAt: block.timestamp,
            payoutToDate: 0,
            buyer: msg.sender,
            status: PolicyStatus.Active
        });

        userPolicyIds[msg.sender].push(policyId);
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
        PolicyTemplate memory template = policyTemplates[userPolicy.templateId];
        return (userPolicy, template);
    }

    // Get all active policy templates (for user browsing)
    function getActivePolicyTemplates() external view returns (PolicyTemplate[] memory) {
        uint256 count = 0;

        for (uint256 i = 0; i < nextPolicyTemplateId; i++) {
            if (policyTemplates[i].status == PolicyTemplateStatus.Active) {
                count++;
            }
        }

        PolicyTemplate[] memory activeTemplates = new PolicyTemplate[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < nextPolicyTemplateId; i++) {
            if (policyTemplates[i].status == PolicyTemplateStatus.Active) {
                activeTemplates[index] = policyTemplates[i];
                index++;
            }
        }

        return activeTemplates;
    }
}
