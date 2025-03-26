// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FlightPolicy.sol";

contract Insurer {
    address public immutable insurerAddress;
    FlightPolicy public flightPolicy;

    constructor(address _flightPolicyAddress) {
        insurerAddress = msg.sender;
        flightPolicy = FlightPolicy(_flightPolicyAddress);
    }

    modifier onlyInsurer() {
        require(msg.sender == insurerAddress, "Insurer: Only the insurer can call this");
        _;
    }

    // ==================== Events ====================
    event FlightPolicyTemplateCreated(uint256 indexed templateId, string name);
    event FlightPolicyTemplateDeactivated(uint256 indexed templateId);
    event FlightPolicyPurchased(address indexed buyer, uint256 indexed policyId, uint256 indexed templateId);

    // ====== Company Functions ======
    /**
     * Create a new flight policy template (as the insurer).
     */
    function createFlightPolicyTemplate(string memory name, string memory description, uint256 premium, uint256 payoutPerHour, uint256 delayThresholdHours, uint256 maxTotalPayout, uint256 coverageDurationDays) external onlyInsurer {
        uint256 templateId = flightPolicy.createPolicyTemplate(
            name,
            description,
            premium,
            payoutPerHour,
            delayThresholdHours,
            maxTotalPayout,
            coverageDurationDays
        );
        emit FlightPolicyTemplateCreated(templateId, name);
    }

    /**
     * Deactivate (soft-delete) a flight policy template.
     */
    function deactivateFlightPolicyTemplate(uint256 templateId) external onlyInsurer {
        flightPolicy.deactivatePolicyTemplate(templateId);
        emit FlightPolicyTemplateDeactivated(templateId);
    }

    /**
     * Get all flight policy templates, including deactivated.
     */
    function getAllFlightPolicyTemplates() external view returns (FlightPolicy.PolicyTemplate[] memory) {
        return flightPolicy.getAllPolicyTemplates();
    }

    /**
     * Get details of a specific flight policy template by ID.
     */
    function getFlightPolicyTemplateById(uint256 templateId) external view returns (FlightPolicy.PolicyTemplate memory) {
        return flightPolicy.getPolicyTemplateById(templateId);
    }

    /**
     * Mark a user’s flight policy as claimed.
     */
    function markFlightPolicyAsClaimed(address buyer, uint256 policyId) external onlyInsurer {
        flightPolicy.markPolicyAsClaimed(buyer, policyId);
    }

    /**
     * Mark a user’s flight policy as expired (after coverage duration).
     */
    function markFlightPolicyAsExpired(uint256 policyId) external onlyInsurer {
        flightPolicy.markPolicyAsExpired(policyId);
    }

    /**
     * Withdraw funds from the contract balance.
     */
    function withdraw(uint256 amountInWei) external onlyInsurer {
        require(address(this).balance >= amountInWei, "Insufficient balance");
        payable(insurerAddress).transfer(amountInWei);
    }


    // ========== User Functions ==========
    /**
     * Purchase a flight policy using a template.
     */
    function purchaseFlightPolicy(uint256 templateId, string memory flightNumber, string memory departureAirportCode, string memory arrivalAirportCode, uint256 departureTime) external payable {
        uint256 policyId = flightPolicy.purchasePolicy{value: msg.value}(
            templateId,
            flightNumber,
            departureAirportCode,
            arrivalAirportCode,
            departureTime
        );

        emit FlightPolicyPurchased(msg.sender, policyId, templateId);
    }

    /**
     * Get all user policies owned by the caller or other address.
     */
    function getUserFlightPolicies(address user) external view returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getUserPolicies(user);
    }

    /**
     * Get a user policy and its template.
     */
    function getFlightPolicyWithTemplate(address user, uint256 policyId) external view returns (FlightPolicy.UserPolicy memory, FlightPolicy.PolicyTemplate memory){
        return flightPolicy.getUserPolicyWithTemplate(user, policyId);
    }

    /**
     * List only active policy templates for user browsing.
     */
    function getActiveFlightPolicyTemplates() external view returns (FlightPolicy.PolicyTemplate[] memory) {
        return flightPolicy.getActivePolicyTemplates();
    }

    // ========== UTILITY ==========
    /**
     * Public function to check if an address is the insurer.
     */
    function isInsurer(address user) public view returns (bool) {
        return user == insurerAddress;
    }

    receive() external payable {}
}
