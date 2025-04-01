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
    event FlightPolicyClaimed(address indexed buyer, uint256 indexed policyId);

    // ====== Insurer Functions ======
    // Create a new flight policy template
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

    // Soft-delete (deactivate) an existing flight policy template
    function deactivateFlightPolicyTemplate(uint256 templateId) external onlyInsurer {
        flightPolicy.deactivatePolicyTemplate(templateId);
        emit FlightPolicyTemplateDeactivated(templateId);
    }

    // View all flight policy templates (including deactivated)
    function getAllFlightPolicyTemplates() external view onlyInsurer returns (FlightPolicy.PolicyTemplate[] memory) {
        return flightPolicy.getAllPolicyTemplates();
    }

    // View a single flight policy template by ID
    function getFlightPolicyTemplateById(uint256 templateId) external view onlyInsurer returns (FlightPolicy.PolicyTemplate memory) {
        return flightPolicy.getPolicyTemplateById(templateId);
    }

    // View all purchased flight policies
    function getAllFlightPolicies() external view onlyInsurer returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getAllPolicies();
    }

    // View all policies for a specific template
    function getUserPoliciesByTemplate(uint256 templateId) external view returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getUserPoliciesByTemplate(templateId);
    }

    function markFlightPolicyAsExpired(uint256 policyId) external onlyInsurer {
        flightPolicy.markPolicyAsExpired(policyId);
    }

    function withdraw(uint256 amountInWei) external onlyInsurer {
        require(address(this).balance >= amountInWei, "Insufficient balance");
        payable(insurerAddress).transfer(amountInWei);
    }

    // ====== User Functions ======
    // Purchase a flight policy based on a template
    function purchaseFlightPolicy(uint256 templateId, string memory flightNumber, string memory departureAirportCode, string memory arrivalAirportCode, uint256 departureTime) external payable {
        uint256 policyId = flightPolicy.purchasePolicy{value: msg.value}(
            templateId,
            flightNumber,
            departureAirportCode,
            arrivalAirportCode,
            departureTime,
            msg.sender
        );

        emit FlightPolicyPurchased(msg.sender, policyId, templateId);
    }

    // Get all flight policies owned by a user
    function getUserFlightPolicies(address user) external view returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getUserPolicies(user);
    }

    // Get a user's flight policy and its associated template
    function getFlightPolicyWithTemplate(address user, uint256 policyId) external view returns (FlightPolicy.UserPolicy memory, FlightPolicy.PolicyTemplate memory){
        return flightPolicy.getUserPolicyWithTemplate(user, policyId);
    }

    // Get all active flight policy templates (for user browsing)
    function getActiveFlightPolicyTemplates() external view returns (FlightPolicy.PolicyTemplate[] memory) {
        return flightPolicy.getActivePolicyTemplates();
    }

    // Claim a policy and payout based on flight delay
    function claimFlightPayout(uint256 policyId) external {
        flightPolicy.claimPayout(policyId, msg.sender);

        emit FlightPolicyClaimed(msg.sender, policyId);
    }

    // ====== Utility Functions ======
    // Check if an address is the insurer.
    function isInsurer(address user) public view returns (bool) {
        return user == insurerAddress;
    }

    receive() external payable {}
}
