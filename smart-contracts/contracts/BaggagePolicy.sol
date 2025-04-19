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

    modifier atStatus(PolicyStatus status) {
        require(userPolicies[nextUserPolicyId].status == status, "BaggagePolicy: Policy is not in the correct status");
        _;
    }

    enum PolicyTemplateStatus {
        Active,
        Deactivated
    }

    struct PolicyTemplate {
        string templateId;                // Unique identifier for the template
        string name;                      // Display name for the policy (e.g., "Lost Baggage Plan")
        string description;               // Description of the coverage, terms, or perks
        uint256 createdAt;                // Timestamp of creation
        uint256 updatedAt;                // Timestamp of last update
        uint256 premium;                  // Cost of the policy (in wei)
        uint256 maxTotalPayout;           // Maximum payout for this policy (in wei)
        uint256 coverageDurationSeconds;  // How long the policy is valid after purchase (in seconds)
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
        string flightNumber;              // Airline flight number (e.g., "SQ322")
        uint256 departureTime;            // Scheduled departure timestamp (UTC)
        string itemDescription;           // Description of the insured baggage item(s)
        uint256 createdAt;                // Policy purchase timestamp
        uint256 payoutToDate;             // Total paid out so far (in wei)
        address buyer;                    // Address of the user
        PolicyStatus status;              // Active, Expired, or Claimed
    }

    enum PayoutResult {
        Pending, 
        NoPayoutDue,
        Success
    }

    // Buyer policy storage
    mapping(uint256 => UserPolicy) public userPolicies;
    mapping(address => uint256[]) public userPolicyIds;
    uint256 public nextUserPolicyId;

    // ==================== Events ====================
    event PayoutEvaluated(uint256 policyId, address buyer, uint256 payout, PayoutResult result);

    // ====== Insurer Functions ======
    // View all purchased policies (InsurerPolicyTemplates, InsurerClaimsOverview)
    function getAllPolicies(uint256 currentTime) external view returns (UserPolicy[] memory) {
        uint256 count = nextUserPolicyId;
        UserPolicy[] memory results = new UserPolicy[](count);
        for (uint256 i = 0; i < count; i++) {
            results[i] = userPolicies[i];
        }
        return updateStatus(results, currentTime);
    }

    // Get all policies by template ID (PolicyTemplateDrawer)
    function getUserPoliciesByTemplate(string memory templateId, uint256 currentTime) external view returns (UserPolicy[] memory) {
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
        return updateStatus(result, currentTime);
    }

    // ====== User Functions ======
    // Purchase a policy based on a template (PurchasePolicy)
    function purchasePolicy(PolicyTemplate memory template, string memory flightNumber, uint256 departureTime, string memory itemDescription, address buyer) external returns (uint256) {
        require(template.status == PolicyTemplateStatus.Active, "Policy template is not active");
        // require(departureTime > block.timestamp, "Departure time must be in the future");
        // require(msg.value >= template.premium, "Insufficient premium sent");

        uint256 policyId = nextUserPolicyId++;
        userPolicies[policyId] = UserPolicy({
            policyId: policyId,
            template: template,
            flightNumber: flightNumber,
            departureTime: departureTime,
            itemDescription: itemDescription,
            createdAt: block.timestamp,
            payoutToDate: 0,
            buyer: buyer,
            status: PolicyStatus.Active
        });

        userPolicyIds[buyer].push(policyId);
        return policyId;
    }

    // Get all policies owned by a user (MyPolicies, MyClaims)
    function getUserPolicies(address user, uint256 currentTime) external view returns (UserPolicy[] memory) {
        uint256 count = userPolicyIds[user].length;
        UserPolicy[] memory results = new UserPolicy[](count);
        for (uint256 i = 0; i < count; i++) {
            results[i] = userPolicies[userPolicyIds[user][i]];
        }
        return updateStatus(results, currentTime);
    }

    // Claim a payout based on the policy (ViewPolicyModal)
    function claimPayout(uint256 policyId, address buyer) external nonReentrant returns (uint256, UserPolicy memory) {
        require(policyId < nextUserPolicyId, "BaggagePolicy: Invalid policy ID");
        UserPolicy storage policy = userPolicies[policyId];
        require(buyer == policy.buyer, "Not policy owner");
        require(policy.status == PolicyStatus.Active, "Policy not active");

        (bool dataReceived, bool baggageStatus) = oracleConnector.getBaggageStatus(policy.flightNumber, Strings.toString(policy.departureTime), policy.itemDescription);
        
        // Retry mechanism
        if (!dataReceived) {
            emit PayoutEvaluated(policyId, buyer, 0, PayoutResult.Pending);
            return (0, policy);
        }

        // Baggage not damaged
        if (!baggageStatus) {
            emit PayoutEvaluated(policyId, buyer, 0, PayoutResult.NoPayoutDue);
            return (0, policy);
        }

        policy.status = PolicyStatus.Claimed;
        uint256 payout = policy.template.maxTotalPayout;
        policy.payoutToDate = payout;

        emit PayoutEvaluated(policyId, buyer, payout, PayoutResult.Success);
        return (payout, policy);
    }

    // ====== Internal Functions ======
    // Update the status of policies based on their expiry
    function updateStatus(UserPolicy[] memory policies, uint256 currentTime) private pure returns (UserPolicy[] memory) {
        for (uint256 i=0; i < policies.length; i++) {
            if (policies[i].status == PolicyStatus.Active) {
                uint256 expiryTime = policies[i].createdAt + policies[i].template.coverageDurationSeconds;
                if (currentTime > expiryTime) {
                    policies[i].status = PolicyStatus.Expired;
                }
            }
        }
        return policies;
    }
}
