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
    event FlightPolicyClaimed(address indexed buyer, uint256 indexed policyId);
    event FundsDeposited(address indexed insurer, uint256 amount);
    event FundsWithdrawn(address indexed insurer, uint256 amount);

    // ====== Insurer Functions ======
    // View all purchased flight policies
    function getAllFlightPolicies() external view onlyInsurer returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getAllPolicies();
    }

    // TODO: Cron job to mark flight policies as expired
    function markFlightPolicyAsExpired(uint256 policyId) external onlyInsurer {
        flightPolicy.markPolicyAsExpired(policyId);
    }

    function withdraw(uint256 amountInWei) external onlyInsurer {
        require(address(this).balance >= amountInWei, "Insufficient balance");
        payable(insurerAddress).transfer(amountInWei);
        emit FundsWithdrawn(insurerAddress, amountInWei);
    }

    // Deposit funds into the contract (only by the insurer)
    function deposit() external payable onlyInsurer {
        require(msg.value > 0, "Insurer: Must deposit a positive amount");
        emit FundsDeposited(insurerAddress, msg.value);
    }

    function getContractBalance() external view onlyInsurer returns (uint256) {
        return address(this).balance;
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

    // Get a specific flight policy with its template (needed for tests)
    function getFlightPolicyWithTemplate(address user, uint256 policyId) external view returns (FlightPolicy.UserPolicy memory policy, FlightPolicy.PolicyTemplate memory template) {
        return flightPolicy.getUserPolicyWithTemplate(user, policyId);
    }

    // Get all flight policies by template ID
    function getUserPoliciesByTemplate(string memory templateId) external view returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getUserPoliciesByTemplate(templateId);
    }

    // Claim a flight policy and give payout based on flight delay
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