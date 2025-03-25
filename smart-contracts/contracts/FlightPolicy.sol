// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FlightPolicy {
    address public immutable insurerAddress;

    enum PolicyStatus {
        Active,
        Expired,
        Claimed,
        Discontinued
    }

    // Template policy struct (created by the company)
    struct PolicyTemplate {
        uint256 templateId;
        uint256 activeDuration;
        uint256 premium;
        uint256 delayPayout;
        uint256 delayThreshold;
        uint256 maxPayout;
        PolicyStatus status;
    }

    // User's purchased policy
    struct UserPolicy {
        uint256 policyId;
        uint256 templateId;
        string flightNumber;
        uint256 departureTime;
        uint256 creationDate;
        uint256 payoutToDate;
        address insured;
        PolicyStatus status;
    }

    uint256 public templateCounter = 0;
    uint256 public userPolicyCounter = 0;

    // Template storage
    PolicyTemplate[] public templates;

    // Mapping from user to their list of policies
    mapping(address => UserPolicy[]) public userPolicies;

    constructor() {
        insurerAddress = msg.sender;
    }

    modifier companyOnly() {
        require(tx.origin == insurerAddress, "Only the company can call this");
        _;
    }

    // ====== Company Functions ======

    function createPolicyTemplate(
        uint256 activeDuration,
        uint256 premium,
        uint256 delayPayout,
        uint256 delayThreshold,
        uint256 maxPayout
    ) external companyOnly returns (uint256) {
        templates.push(PolicyTemplate({
            templateId: templateCounter,
            activeDuration: activeDuration,
            premium: premium * 1 ether,
            delayPayout: delayPayout * 1 ether,
            delayThreshold: delayThreshold,
            maxPayout: maxPayout * 1 ether,
            status: PolicyStatus.Active
        }));
        templateCounter++;
        return templateCounter;
    }

    function deletePolicyTemplate(uint256 templateId) external companyOnly {
        require(templateId < templateCounter, "Invalid template ID");
        templates[templateId].status = PolicyStatus.Discontinued;
    }

    function getAllPolicyTemplates() external view returns (PolicyTemplate[] memory) {
        return templates;
    }

    function getPolicyTemplate(uint256 templateId) external view returns (PolicyTemplate memory) {
        require(templateId < templateCounter, "Invalid template ID");
        return templates[templateId];
    }

    function markAsClaimed(address user, uint256 policyId) external companyOnly {
        require(policyId < userPolicies[user].length, "Invalid policy ID");
        userPolicies[user][policyId].status = PolicyStatus.Claimed;
    }

    // ====== User Functions ======

    function purchasePolicy(
        uint256 templateId,
        string memory flightNumber,
        uint256 departureTime,
        address buyer
    ) external returns (uint256) {
        require(templateId < templateCounter, "Invalid template");
        PolicyTemplate memory tpl = templates[templateId];
        require(tpl.status == PolicyStatus.Active, "Template is discontinued");
        require(departureTime > block.timestamp, "Flight must be in the future");

        userPolicies[buyer].push(UserPolicy({
            policyId: userPolicies[buyer].length,
            templateId: templateId,
            flightNumber: flightNumber,
            departureTime: departureTime,
            creationDate: block.timestamp,
            payoutToDate: 0,
            insured: buyer,
            status: PolicyStatus.Active
        }));

        userPolicyCounter++;
        return userPolicies[buyer].length;
    }

    function getPoliciesOf(address user) external view returns (UserPolicy[] memory) {
        return userPolicies[user];
    }

    // ====== Internal Utilities ======

    function _updateStatusIfExpired(UserPolicy storage p, uint256 activeDuration) internal {
        if (p.status == PolicyStatus.Active && block.timestamp > p.creationDate + (activeDuration * 1 days)) {
            p.status = PolicyStatus.Expired;
        }
    }
}
