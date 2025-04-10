// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OracleConnector.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BaggagePolicy is ReentrancyGuard {
    address public immutable insurerAddress;
    OracleConnector public oracleConnector;

    constructor(address _oracleConnector) {
        insurerAddress = msg.sender;
        oracleConnector = OracleConnector(_oracleConnector);
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
        uint256 templateId;             
        string name;                    
        string description;             
        uint256 createdAt;    
        uint256 premium;               
        uint256 payoutIfDelayed;
        uint256 payoutIfLost;
        uint256 delayThresholdHours; // payout for delay if pass threshold  
        uint256 maxTotalPayout; // should be sum of payoutIfDelayed and payoutIfLost       
        uint256 minPayoutAmt; // for case of no receipt
        uint256 coverageDurationDays; // How long the policy is valid after purchase
        PolicyTemplateStatus status;   
    }

    enum PolicyStatus {
        Active,
        Expired,
        Claimed
    }

    struct UserPolicy {
        uint256 policyId;               // Unique ID of the buyer's policy
        uint256 templateId;             // ID reference to PolicyTemplate used
        uint256 createdAt;              // Policy purchase timestamp
        uint256 payoutToDate;           // Track payoutToDate to compare to maxTotalPayout
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
    function createPolicyTemplate(string memory name, string memory description, uint256 premium, uint256 payoutIfDelayed, uint256 payoutIfLost, uint256 delayThresholdHours, uint256 maxTotalPayout, uint256 minPayoutAmt, uint256 coverageDurationDays) external onlyInsurer returns (uint256) {
        uint256 templateId = nextPolicyTemplateId;

        policyTemplates[templateId] = PolicyTemplate({
            templateId: templateId,
            name: name,
            description: description,
            createdAt: block.timestamp,
            premium: premium * 1 ether,
            payoutIfDelayed: payoutIfDelayed * 1 ether,
            payoutIfLost: payoutIfLost * 1 ether,
            delayThresholdHours: delayThresholdHours,
            maxTotalPayout: maxTotalPayout * 1 ether,
            minPayoutAmt: minPayoutAmt * 1 ether,
            status: PolicyTemplateStatus.Active,
            coverageDurationDays: coverageDurationDays
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
    function getAllPolicyTemplates() external view onlyInsurer returns (PolicyTemplate[] memory) {
        PolicyTemplate[] memory result = new PolicyTemplate[](nextPolicyTemplateId);
        for (uint256 i = 0; i < nextPolicyTemplateId; i++) {
            result[i] = policyTemplates[i];
        }
        return result;
    }

    // View a single policy template by ID
    function getPolicyTemplateById(uint256 templateId) external view onlyInsurer returns (PolicyTemplate memory) {
        require(templateId < nextPolicyTemplateId, "Template does not exist");
        return policyTemplates[templateId];
    }

    // View all purchased policies
    function getAllPolicies() external view onlyInsurer returns (UserPolicy[] memory) {
        uint256 count = nextUserPolicyId;
        UserPolicy[] memory results = new UserPolicy[](count);
        for (uint256 i = 0; i < count; i++) {
            results[i] = userPolicies[i];
        }
        return results;
    }

    // View all policies for a specific template
    function getUserPoliciesByTemplate(uint256 templateId) external view returns (UserPolicy[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextUserPolicyId; i++) {
            if (userPolicies[i].templateId == templateId) {
                count++;
            }
        }
        UserPolicy[] memory result = new UserPolicy[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < nextUserPolicyId; i++) {
            if (userPolicies[i].templateId == templateId) {
                result[j] = userPolicies[i];
                j++;
            }
        }
        return result;
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
    function purchasePolicy(uint256 templateId, address buyer) external payable returns (uint256) {
        require(templateId < nextPolicyTemplateId, "Invalid templateId");

        PolicyTemplate memory template = policyTemplates[templateId];
        require(template.status == PolicyTemplateStatus.Active, "Policy template is not active");
        require(msg.value >= template.premium, "Insufficient premium sent");

        uint256 policyId = nextUserPolicyId++;
        userPolicies[policyId] = UserPolicy({
            policyId: policyId,
            templateId: templateId,
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

    // Claim a policy and payout based on flight delay
    // Not sure what we want to do with this
    // 1. there is a case of baggage delay
    // 2. there is a case of baggage lost with receipt
    // 3. there is a case of baggage lost without receipt
    // function claimPayout(uint256 policyId, address buyer) external nonReentrant {
    //     require(policyId < nextUserPolicyId, "Invalid policyId");

    //     UserPolicy storage policy = userPolicies[policyId];
    //     require(buyer == policy.buyer, "Not policy owner");
    //     require(policy.status == PolicyStatus.Active, "Policy not active");

    //     PolicyTemplate memory template = policyTemplates[policy.templateId];
    //     string memory departureTimeStr = Strings.toString(policy.departureTime);

    //     (bool isDelayed, uint256 delayHours) = oracleConnector.getFlightStatus(policy.flightNumber, departureTimeStr);
    //     require(isDelayed, "Flight not delayed");

    //     uint256 payout = delayHours * template.payoutPerHour;
    //     if (payout > template.maxTotalPayout) {
    //         payout = template.maxTotalPayout;
    //     }

    //     require(payout > 0, "No payout due");
    //     require(address(this).balance >= payout, "Insufficient contract balance");

    //     policy.status = PolicyStatus.Claimed;
    //     policy.payoutToDate = payout;

    //     payable(policy.buyer).transfer(payout);
    // }
}
