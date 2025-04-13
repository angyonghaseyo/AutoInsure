// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FlightPolicy.sol";
import "./BaggagePolicy.sol";

contract Insurer {
    address public immutable insurerAddress;
    FlightPolicy public flightPolicy;
    BaggagePolicy public baggagePolicy;

    constructor(address _flightPolicyAddress, address _baggagePolicyAddress) {
        insurerAddress = msg.sender;
        flightPolicy = FlightPolicy(_flightPolicyAddress);
        baggagePolicy = BaggagePolicy(_baggagePolicyAddress);
    }

    modifier onlyInsurer() {
        require(msg.sender == insurerAddress, "Insurer: Only the insurer can call this");
        _;
    }

    // ==================== Events ====================
    event FlightPolicyPurchased(address indexed buyer, uint256 indexed policyId, string indexed templateId);
    event FlightPolicyClaimed(address indexed buyer, uint256 indexed policyId);
    event BaggagePolicyPurchased(address indexed buyer, uint256 indexed policyId, string indexed templateId);
    event BaggagePolicyClaimed(address indexed buyer, uint256 indexed policyId);
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

    // View all purchased baggage policies
    function getAllBaggagePolicies() external view onlyInsurer returns (BaggagePolicy.UserPolicy[] memory) {
        return baggagePolicy.getAllPolicies();
    }

    // TODO: Cron job to mark baggage policies as expired
    function markBaggagePolicyAsExpired(uint256 policyId) external onlyInsurer {
        baggagePolicy.markPolicyAsExpired(policyId);
    }

    // Deposit funds into the contract
    function deposit() external payable onlyInsurer {
        require(msg.value > 0, "Insurer: Must deposit a positive amount");
        emit FundsDeposited(insurerAddress, msg.value);
    }

    // Withdraw funds from the contract
    function withdraw(uint256 amountInWei) external onlyInsurer {
        require(address(this).balance >= amountInWei, "Insufficient balance");
        payable(insurerAddress).transfer(amountInWei);
        emit FundsWithdrawn(insurerAddress, amountInWei);
    }

    // Get the contract balance
    function getContractBalance() external view onlyInsurer returns (uint256) {
        return address(this).balance;
    }

    // ====== User Functions ======
    // Purchase a flight policy based on a template
    function purchaseFlightPolicy(FlightPolicy.PolicyTemplate memory template, string memory flightNumber, string memory departureAirportCode, string memory arrivalAirportCode, uint256 departureTime) external payable {
        uint256 totalPossiblePayout = getMaxPossiblePayout();
        totalPossiblePayout += template.maxTotalPayout;
        require(totalPossiblePayout <= address(this).balance, "Insufficient contract balance to cover potential payouts");

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

    // Get all flight policies by template ID
    function getUserFlightPoliciesByTemplate(string memory templateId) external view returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getUserPoliciesByTemplate(templateId);
    }

    // Claim a flight policy and give payout based on flight delay
    function claimFlightPayout(uint256 policyId) external {
        flightPolicy.claimPayout(policyId, msg.sender);

        emit FlightPolicyClaimed(msg.sender, policyId);
    }

    // Purchase a baggage policy based on a template
    function purchaseBaggagePolicy(BaggagePolicy.PolicyTemplate memory template, string memory itemDescription) external payable {
        uint256 totalPossiblePayout = getMaxPossiblePayout();
        totalPossiblePayout += template.maxTotalPayout;
        require(totalPossiblePayout <= address(this).balance, "Insufficient contract balance to cover potential payouts");

        uint256 policyId = baggagePolicy.purchasePolicy{value: msg.value}(
            template,
            itemDescription,
            msg.sender
        );

        emit BaggagePolicyPurchased(msg.sender, policyId, template.templateId);
    }

    // Get all baggage policies owned by a user
    function getUserBaggagePolicies(address user) external view returns (BaggagePolicy.UserPolicy[] memory) {
        return baggagePolicy.getUserPolicies(user);
    }

    // Get all baggage policies by template ID
    function getUserBaggagePoliciesByTemplate(string memory templateId) external view returns (BaggagePolicy.UserPolicy[] memory) {
        return baggagePolicy.getUserPoliciesByTemplate(templateId);
    }

    // ====== Utility Functions ======
    // Check if an address is the insurer.
    function isInsurer(address user) public view returns (bool) {
        return user == insurerAddress;
    }

    // Get the maximum possible payout for all policies
    function getMaxPossiblePayout() internal view returns (uint256) {
        uint256 totalPossiblePayout = 0;
        FlightPolicy.UserPolicy[] memory flightPolicies = flightPolicy.getAllPolicies();
        BaggagePolicy.UserPolicy[] memory baggagePolicies = baggagePolicy.getAllPolicies();
        for (uint256 i = 0; i < flightPolicies.length; i++) {
            totalPossiblePayout += flightPolicies[i].template.maxTotalPayout;
        }
        for (uint256 i = 0; i < baggagePolicies.length; i++) {
            totalPossiblePayout += baggagePolicies[i].template.maxTotalPayout;
        }
        return totalPossiblePayout;
    }

    // Check if flight policies are allowed for purchase based on the contract balance
    function isFlightPolicyAllowedForPurchase(FlightPolicy.PolicyTemplate[] memory templates) external view returns (bool[] memory) {
        bool[] memory allowed = new bool[](templates.length);
        uint256 currentTotalPossiblePayout = getMaxPossiblePayout();
        for (uint256 i = 0; i < templates.length; i++) {
            uint256 totalPossiblePayout = currentTotalPossiblePayout + templates[i].maxTotalPayout;
            if (totalPossiblePayout * 1 ether > address(this).balance) {
                allowed[i] = false;
            } else {
                allowed[i] = true;
            }
        }
        return allowed;
    }

    // Check if baggage policies are allowed for purchase based on the contract balance
    function isBaggagePolicyAllowedForPurchase(BaggagePolicy.PolicyTemplate[] memory templates) external view returns (bool[] memory) {
        bool[] memory allowed = new bool[](templates.length);
        uint256 currentTotalPossiblePayout = getMaxPossiblePayout();
        for (uint256 i = 0; i < templates.length; i++) {
            uint256 totalPossiblePayout = currentTotalPossiblePayout + templates[i].maxTotalPayout;
            if (totalPossiblePayout * 1 ether > address(this).balance) {
                allowed[i] = false;
            } else {
                allowed[i] = true;
            }
        }
        return allowed;
    }

    receive() external payable {}
}
