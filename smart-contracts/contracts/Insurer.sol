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
    event FlightPolicyPurchased(address indexed buyer, uint256 indexed policyId, string indexed templateId);

    // ====== Insurer Functions ======

    // View all purchased flight policies
    function getAllFlightPolicies() external view onlyInsurer returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getAllPolicies();
    }

    function markFlightPolicyAsClaimed(address buyer, uint256 policyId) external onlyInsurer {
        flightPolicy.markPolicyAsClaimed(buyer, policyId);
    }

    function markFlightPolicyAsExpired(uint256 policyId) external onlyInsurer {
        flightPolicy.markPolicyAsExpired(policyId);
    }

    function getUserPoliciesByTemplate(string memory templateId) external view returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getUserPoliciesByTemplate(templateId);
    }

    function withdraw(uint256 amountInWei) external onlyInsurer {
        require(address(this).balance >= amountInWei, "Insufficient balance");
        payable(insurerAddress).transfer(amountInWei);
    }


    // ====== User Functions ======
    // Purchase a flight policy based on a template
    function purchaseFlightPolicy(FlightPolicy.PolicyTemplate memory template, string memory flightNumber, string memory departureAirportCode, string memory arrivalAirportCode, uint256 departureTime) external payable {
        uint256 policyId = flightPolicy.purchasePolicy{value: msg.value}(
            template,
            flightNumber,
            departureAirportCode,
            arrivalAirportCode,
            departureTime,
            msg.sender
        );

        emit FlightPolicyPurchased(msg.sender, policyId, template.templateId);
    }

    // Get all flight policies owned by a user
    function getUserFlightPolicies(address user) external view returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getUserPolicies(user);
    }

    // Get a user's flight policy and its associated template
    function getFlightPolicyWithTemplate(address user, uint256 policyId) external view returns (FlightPolicy.UserPolicy memory, FlightPolicy.PolicyTemplate memory){
        return flightPolicy.getUserPolicyWithTemplate(user, policyId);
    }

    // ====== Utility Functions ======
    // Check if an address is the insurer.
    function isInsurer(address user) public view returns (bool) {
        return user == insurerAddress;
    }

    receive() external payable {}
}
