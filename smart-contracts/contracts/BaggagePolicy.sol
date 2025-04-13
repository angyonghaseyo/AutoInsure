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
        require(tx.origin == insurerAddress, "BaggagePolicy: Only the insurer can call this function");
        _;
    }

    modifier atStatus(PolicyStatus status) {
        require(userPolicies[nextUserPolicyId].status == status, "BaggagePolicy: Policy is not in the correct status");
        _;
    }

    enum PolicyTemplateStatus {
        Active,
        Deactivated
    }

    struct PolicyTemplate {
        string templateId;               // Unique identifier for the template
        string name;                      // Display name for the policy (e.g., "Lost Baggage Plan")
        string description;               // Description of the coverage, terms, or perks
        uint256 createdAt;                // Timestamp of creation
        uint256 updatedAt;                // Timestamp of last update
        uint256 premium;                  // Cost of the policy (in wei)
        uint256 payoutIfDelayed;          // Payout amount for delayed baggage (in wei)
        uint256 payoutIfLost;             // Payout amount for lost baggage (in wei)
        uint256 maxTotalPayout;           // Maximum payout for this policy (in wei)
        uint256 coverageDurationDays;     // How long the policy is valid after purchase
        PolicyTemplateStatus status;      // Whether the template is active or deactivated  
    }

    enum PolicyStatus {
        Active,
        Expired,
        Claimed
    }

    struct UserPolicy {
        uint256 policyId;                 // Unique ID of the buyer's policy
        PolicyTemplate template;          // Policy template details
        string itemDescription;           // Description of the insured baggage item(s)
        uint256 createdAt;                // Policy purchase timestamp
        uint256 payoutToDate;             // Total paid out so far (in wei)
        address buyer;                    // Address of the user
        PolicyStatus status;              // Active, Expired, or Claimed
    }

    // Buyer policy storage
    mapping(uint256 => UserPolicy) public userPolicies;
    mapping(address => uint256[]) public userPolicyIds;
    uint256 public nextUserPolicyId;

    // ====== Insurer Functions ======
    // View all purchased policies
    function getAllPolicies() external view returns (UserPolicy[] memory) {
        uint256 count = nextUserPolicyId;
        UserPolicy[] memory results = new UserPolicy[](count);
        for (uint256 i = 0; i < count; i++) {
            results[i] = userPolicies[i];
        }
        return updateStatus(results);
    }

    // TODO: Cron job to mark policies as expired
    function markPolicyAsExpired(uint256 policyId) atStatus(PolicyStatus.Active) external onlyInsurer {
        require(policyId < nextUserPolicyId, "Invalid policyId");
        
        UserPolicy storage policy = userPolicies[policyId];
        require(policy.status == PolicyStatus.Active, "Policy is not active");

        uint256 expiryTime = policy.createdAt + (policy.template.coverageDurationDays * 1 days);

        require(block.timestamp > expiryTime, "Policy has not expired yet");

        policy.status = PolicyStatus.Expired;
    }

    // ====== User Functions ======
    // Purchase a policy based on a template
    function purchasePolicy(PolicyTemplate memory template, string memory itemDescription, address buyer) external payable returns (uint256) {
        require(template.status == PolicyTemplateStatus.Active, "Policy template is not active");
        require(msg.value >= template.premium, "Insufficient premium sent");

        uint256 policyId = nextUserPolicyId++;
        userPolicies[policyId] = UserPolicy({
            policyId: policyId,
            template: template,
            itemDescription: itemDescription,
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
        return updateStatus(results);
    }

    // Get all policies by template ID
    function getUserPoliciesByTemplate(string memory templateId) external view returns (UserPolicy[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nextUserPolicyId; i++) {
            if (keccak256(abi.encodePacked(userPolicies[i].template.templateId)) == keccak256(abi.encodePacked(templateId))) {
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
        return updateStatus(result);
    }

    function updateStatus(UserPolicy[] memory policies) private view returns (UserPolicy[] memory) {
        for (uint256 i=0; i < policies.length; i++) {
            if (policies[i].status == PolicyStatus.Active) {
                uint256 expiryTime = policies[i].createdAt + (userPolicies[i].template.coverageDurationDays * 1 days);
                if (block.timestamp > expiryTime) {
                    policies[i].status = PolicyStatus.Expired;
                }
            }
        }
        return policies;
    }
}
