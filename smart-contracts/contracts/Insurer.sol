// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Policy.sol";
//import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract Insurer {
    Policy flightPolicyInstance;
    address company;

    constructor() {
        flightPolicyInstance = new Policy();
        company = msg.sender;
    }

    event PolicyAdded(uint256 policyTypeId);
    event PolicyDeleted(uint256 policyTypeId);
    event PolicyBought(uint256 policyId);
    event Payout(uint256 amount, address recipient); 

    mapping(address => bool) public policyHolders; //maps to something...

    modifier holderOnly() {
        require(policyHolders[msg.sender], "You do not own a policy");
        _;
    }

    modifier companyOnly() {
        require(msg.sender == company, "Insurer, Only the owner can call this function");
        _;
    }

    function addPolicy(uint256 premium, uint256 delayPayout, uint256 maxPayout) public companyOnly {
        uint256 policyTypeId = flightPolicyInstance.createPolicy(premium, delayPayout, maxPayout);
        emit PolicyAdded(policyTypeId);
    }

    function deletePolicy(uint256 policyTypeId) public companyOnly {
        flightPolicyInstance.deletePolicy(policyTypeId);
        emit PolicyDeleted(policyTypeId);
    }

    function buyPolicy(uint256 policyType, string memory flight, uint256 departureTime) public payable {
        Policy.policy memory policyDetails = flightPolicyInstance.getPolicyDetails(policyType);
        require(msg.value >= policyDetails.premium, "Not enough ether to purhcase plan");
        require(departureTime > block.timestamp, "Flight is not a future flight");
        flightPolicyInstance.purchasePolicy(policyType, flight, msg.sender);
        policyHolders[msg.sender] = true;
        emit PolicyBought(policyType);
    }

    function claimPolicy() external holderOnly {
        Policy.policy memory policyData = flightPolicyInstance.getPolicyOfInsured(msg.sender);
        
        require(!policyData.isClaimed, "Policy already claimed");
        uint256 totalPayout = policyData.delayPayout;
        // TODO: Request flight status from oracle, multiply totalpayout with units of hours delayed
        
        // Process payout
        if (totalPayout > policyData.maxPayout) {
            totalPayout = policyData.maxPayout;
        }
        
        // Transfer payout to policyholder
        payable(policyData.insured).transfer(totalPayout);
        flightPolicyInstance.markAsClaimed(msg.sender);
        emit Payout(totalPayout, policyData.insured);
    }
    
    function withdrawFunds(uint256 amount) external payable companyOnly() {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(company).transfer(amount * 1 ether);
    }

    receive() external payable {}
}
