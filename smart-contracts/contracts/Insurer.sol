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
    event BaggagePolicyPurchased(address indexed buyer, uint256 indexed policyId, string indexed templateId);
    event FundsDeposited(address indexed insurer, uint256 amount);
    event FundsWithdrawn(address indexed insurer, uint256 amount);
    event PayoutClaimed(uint256 indexed policyId, address indexed buyer, uint256 amount);

    // ====== Insurer Functions ======
    // View all purchased flight policies (InsurerPolicyTemplates, InsurerClaimsOverview)
    function getAllFlightPolicies(uint256 currentTime) external view onlyInsurer returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getAllPolicies(currentTime);
    }

    // View all purchased baggage policies (InsurerPolicyTemplates, InsurerClaimsOverview)
    function getAllBaggagePolicies(uint256 currentTime) external view onlyInsurer returns (BaggagePolicy.UserPolicy[] memory) {
        return baggagePolicy.getAllPolicies(currentTime);
    }

    // Get all flight policies by template ID (PolicyTemplateDrawer)
    function getUserFlightPoliciesByTemplate(string memory templateId, uint256 currentTime) external view onlyInsurer returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getUserPoliciesByTemplate(templateId, currentTime);
    }

    // Get all baggage policies by template ID (PolicyTemplateDrawer)
    function getUserBaggagePoliciesByTemplate(string memory templateId, uint256 currentTime) external view onlyInsurer() returns (BaggagePolicy.UserPolicy[] memory) {
        return baggagePolicy.getUserPoliciesByTemplate(templateId, currentTime);
    }

    // Deposit funds into the contract (MetaMask, etc.)
    function deposit() external payable onlyInsurer {
        require(msg.value > 0, "Insurer: Must deposit a positive amount");
        emit FundsDeposited(insurerAddress, msg.value);
    }

    // Withdraw funds from the contract (MetaMask, etc.)
    function withdraw(uint256 amountInWei) external onlyInsurer {
        require(address(this).balance >= amountInWei, "Insufficient balance");
        payable(insurerAddress).transfer(amountInWei);
        emit FundsWithdrawn(insurerAddress, amountInWei);
    }

    // Get the contract balance (MetaMask, etc.)
    function getContractBalance() external view onlyInsurer returns (uint256) {
        return address(this).balance;
    }

    // ====== User Functions ======
    // Purchase a flight policy based on a template (PurchasePolicy)
    function purchaseFlightPolicy(FlightPolicy.PolicyTemplate memory template, string memory flightNumber, uint256 departureTime, uint256 currentTime) external payable {
        uint256 totalPossiblePayout = getMaxPossiblePayout(currentTime);
        totalPossiblePayout += template.maxTotalPayout;
        require(totalPossiblePayout <= address(this).balance, "Insufficient contract balance to cover potential payouts");
        require(msg.value >= template.premium, "Insufficient premium sent");

        uint256 policyId = flightPolicy.purchasePolicy(
            template,
            flightNumber,
            departureTime,
            msg.sender
        );

        emit FlightPolicyPurchased(msg.sender, policyId, template.templateId);
    }

    // Purchase a baggage policy based on a template (PurchasePolicy)
    function purchaseBaggagePolicy(BaggagePolicy.PolicyTemplate memory template, string memory flightNumber, uint256 departureTime, string memory itemDescription, uint256 currentTime) external payable {
        uint256 totalPossiblePayout = getMaxPossiblePayout(currentTime);
        totalPossiblePayout += template.maxTotalPayout;
        require(totalPossiblePayout <= address(this).balance, "Insufficient contract balance to cover potential payouts");
        require(msg.value >= template.premium, "Insufficient premium sent");

        uint256 policyId = baggagePolicy.purchasePolicy(
            template,
            flightNumber,
            departureTime,
            itemDescription,
            msg.sender
        );

        emit BaggagePolicyPurchased(msg.sender, policyId, template.templateId);
    }

    // Get all flight policies owned by a user (MyPolicies, MyClaims)
    function getUserFlightPolicies(address user, uint256 currentTime) external view returns (FlightPolicy.UserPolicy[] memory) {
        return flightPolicy.getUserPolicies(user, currentTime);
    }

    // Get all baggage policies owned by a user (MyPolicies, MyClaims)
    function getUserBaggagePolicies(address user, uint256 currentTime) external view returns (BaggagePolicy.UserPolicy[] memory) {
        return baggagePolicy.getUserPolicies(user, currentTime);
    }

    // Claim a payout based on the flight policy (ViewPolicyModal)
    function claimFlightPayout(uint256 policyId) external {
        (uint256 payout, FlightPolicy.UserPolicy memory policy) = flightPolicy.claimPayout(policyId, msg.sender);

        if (payout == 0) {
            return;
        }

        require(address(this).balance >= payout, "Insufficient contract balance");

        payable(policy.buyer).transfer(payout);
        emit PayoutClaimed(policyId, policy.buyer, payout);
    }

    // Claim a payout based on the baggage policy (ViewPolicyModal)
    function claimBaggagePayout(uint256 policyId) external {
        (uint256 payout, BaggagePolicy.UserPolicy memory policy) = baggagePolicy.claimPayout(policyId, msg.sender);

        if (payout == 0) {
            return;
        }

        require(address(this).balance >= payout, "Insufficient contract balance");

        payable(policy.buyer).transfer(payout);
        emit PayoutClaimed(policyId, policy.buyer, payout);
    }

    // ====== Utility Functions ======
    // Check if an address is the insurer (Web3Provider)
    function isInsurer(address user) public view returns (bool) {
        return user == insurerAddress;
    }

    // Check if flight policy templates are allowed for purchase based on the contract balance (BrowsePolicyTemplates)
    function isFlightPolicyTemplateAllowedForPurchase(FlightPolicy.PolicyTemplate[] memory templates, uint256 currentTime) external view returns (bool[] memory) {
        bool[] memory allowed = new bool[](templates.length);
        uint256 currentTotalPossiblePayout = getMaxPossiblePayout(currentTime);
        for (uint256 i = 0; i < templates.length; i++) {
            uint256 totalPossiblePayout = currentTotalPossiblePayout + templates[i].maxTotalPayout;
            if (totalPossiblePayout > address(this).balance) {
                allowed[i] = false;
            } else {
                allowed[i] = true;
            }
        }
        return allowed;
    }

    // Check if baggage policy templates are allowed for purchase based on the contract balance (BrowsePolicyTemplates)
    function isBaggagePolicyTemplateAllowedForPurchase(BaggagePolicy.PolicyTemplate[] memory templates, uint256 currentTime) external view returns (bool[] memory) {
        bool[] memory allowed = new bool[](templates.length);
        uint256 currentTotalPossiblePayout = getMaxPossiblePayout(currentTime);
        for (uint256 i = 0; i < templates.length; i++) {
            uint256 totalPossiblePayout = currentTotalPossiblePayout + templates[i].maxTotalPayout;
            if (totalPossiblePayout > address(this).balance) {
                allowed[i] = false;
            } else {
                allowed[i] = true;
            }
        }
        return allowed;
    }
    
    // ====== Internal Functions ======
    // Get the maximum possible payout for all policies
    function getMaxPossiblePayout(uint256 currentTime) internal view returns (uint256) {
        uint256 totalPossiblePayout = 0;
        FlightPolicy.UserPolicy[] memory flightPolicies = flightPolicy.getAllPolicies(currentTime);
        BaggagePolicy.UserPolicy[] memory baggagePolicies = baggagePolicy.getAllPolicies(currentTime);
        for (uint256 i = 0; i < flightPolicies.length; i++) {
            if (flightPolicies[i].status == FlightPolicy.PolicyStatus.Active) {
                totalPossiblePayout += flightPolicies[i].template.maxTotalPayout;
            }
        }
        for (uint256 i = 0; i < baggagePolicies.length; i++) {
            if (baggagePolicies[i].status == BaggagePolicy.PolicyStatus.Active) {
                totalPossiblePayout += baggagePolicies[i].template.maxTotalPayout;
            }
        }
        return totalPossiblePayout;
    }

    receive() external payable {}
}
