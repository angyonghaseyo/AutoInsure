// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FlightPolicy.sol";

contract Insurer {
    FlightPolicy public flightPolicyInstance;
    address public company;

    constructor(address _flightPolicyAddress) {
        flightPolicyInstance = FlightPolicy(_flightPolicyAddress);
        company = msg.sender;
    }

    event PolicyAdded(uint256 policyTypeId);
    event PolicyDeleted(uint256 policyTypeId);
    event PolicyBought(uint256 policyId);
    event Payout(uint256 amount, address recipient); 
    event FlightAdded(string flightNumber, uint256 departureTime);

    // Maps user to their last purchased policy ID
    mapping(address => uint256) public flightPolicyHolders;

    modifier holderOnly() {
        require(flightPolicyHolders[msg.sender] != 0, "You do not own a flight policy");
        _;
    }

    modifier companyOnly() {
        require(msg.sender == company, "Only the company can call this function");
        _;
    }

    function isCompany(address user) public view returns (bool) {
        return user == company;
    }

    // ========== Company Functions ==========
    function addPolicy(uint256 premium, uint256 delayPayout, uint256 maxPayout, uint256 delayThreshold, uint256 activeDuration) external companyOnly {
        uint256 policyTypeId = flightPolicyInstance.createPolicy(activeDuration, premium, delayPayout, delayThreshold, maxPayout);
        emit PolicyAdded(policyTypeId);
    }

    function deletePolicy(uint256 policyTypeId) external companyOnly {
        flightPolicyInstance.deletePolicy(policyTypeId);
        emit PolicyDeleted(policyTypeId);
    }

    function withdrawFunds(uint256 amountInWei) external companyOnly() {
        require(amountInWei <= address(this).balance, "Insufficient balance");
        payable(company).transfer(amountInWei);
    }

    // ========== User Functions ==========
    function buyPolicy(uint256 policyType, string memory flight, uint256 departureTime) external payable {
        // Fetch the policy template
        FlightPolicy.policy memory policyDetails = flightPolicyInstance.getPolicyDetails(policyType);

        // Check ETH sent
        require(msg.value >= policyDetails.premium, "Not enough ETH to purchase policy");

        // Validate flight timing
        require(departureTime > block.timestamp, "Flight must be in the future");

        // Fetch all policies for this user
        FlightPolicy.policy[] memory userPolicies = flightPolicyInstance.getPolicyOfInsured(msg.sender);

        // Check if any existing policy is still active
        for (uint256 i = 0; i < userPolicies.length; i++) {
            if (userPolicies[i].status == FlightPolicy.PolicyStatus.Active) {
                revert("You already have an active policy");
            }
        }

        // Proceed with purchase
        uint256 policyId = flightPolicyInstance.purchasePolicy(policyType, flight, departureTime, msg.sender);
        flightPolicyHolders[msg.sender] = policyId;

        emit PolicyBought(policyId);
    }


    function claimPolicy() external holderOnly {
        uint256 lastPolicyIndex = flightPolicyHolders[msg.sender] - 1;
        FlightPolicy.policy[] memory policies = flightPolicyInstance.getPolicyOfInsured(msg.sender);
        FlightPolicy.policy memory policyData = policies[lastPolicyIndex];

        require(policyData.status == FlightPolicy.PolicyStatus.Active, "Policy already claimed or expired");

        uint256 totalPayout = policyData.delayPayout;

        // Cap payout at max
        if (totalPayout > policyData.maxPayout) {
            totalPayout = policyData.maxPayout;
        }
        
        // Transfer payout
        payable(policyData.insured).transfer(totalPayout);

        flightPolicyInstance.markAsClaimed(msg.sender);
        emit Payout(totalPayout, policyData.insured);
    }

    function addNewFlight(string memory flight, uint256 departureTime) external holderOnly() {
        require(departureTime > block.timestamp, "Flight must be in the future");
        flightPolicyInstance.addFlightDetails(flight, departureTime, msg.sender, flightPolicyHolders[msg.sender]);
        emit FlightAdded(flight, departureTime);
    }

    // ========== Public View Functions ==========
    function getPolicyOfCustomer(address user) public view returns (FlightPolicy.policy[] memory) {
        return flightPolicyInstance.getPolicyOfInsured(user);
    }

    function getCompanyPolicies() public view returns (FlightPolicy.policy[] memory) {
        FlightPolicy.policy[] memory allPolicies = flightPolicyInstance.getAllPolicyTypes();

        // Count how many are active
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allPolicies.length; i++) {
            if (allPolicies[i].status == FlightPolicy.PolicyStatus.Active) {
                activeCount++;
            }
        }

        // Collect the active ones
        FlightPolicy.policy[] memory activePolicies = new FlightPolicy.policy[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allPolicies.length; i++) {
            if (allPolicies[i].status == FlightPolicy.PolicyStatus.Active) {
                activePolicies[index++] = allPolicies[i];
            }
        }

        return activePolicies;
    }
}
