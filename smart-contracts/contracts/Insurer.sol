// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FlightPolicy.sol";
//import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract Insurer {
    FlightPolicy flightPolicyInstance;
    address company;

    constructor(address companyWallet) {
        flightPolicyInstance = new FlightPolicy(companyWallet);
        company = companyWallet;
    }

    event PolicyAdded(uint256 policyTypeId);
    event PolicyDeleted(uint256 policyTypeId);
    event PolicyBought(uint256 policyId);
    event Payout(uint256 amount, address recipient); 
    event FlightAdded(string flightNumber, uint256 departureTime);

    mapping(address => uint256) public flightPolicyHolders;

    modifier holderOnly() {
        require(flightPolicyHolders[msg.sender] != 0, "You do not own a flight policy");
        _;
    }

    modifier companyOnly() {
        require(msg.sender == company, "Insurer, Only the owner can call this function");
        _;
    }

    function addPolicy(uint256 premium, uint256 delayPayout, uint256 maxPayout, uint256 delayThreshold, uint256 activeDuration) public companyOnly {
        uint256 policyTypeId = flightPolicyInstance.createPolicy(premium, delayPayout, maxPayout, delayThreshold, activeDuration);
        emit PolicyAdded(policyTypeId);
    }

    function deletePolicy(uint256 policyTypeId) public companyOnly {
        flightPolicyInstance.deletePolicy(policyTypeId);
        emit PolicyDeleted(policyTypeId);
    }

    function buyPolicy(uint256 policyType, string memory flight, uint256 departureTime) public payable {
        FlightPolicy.policy memory policyDetails = flightPolicyInstance.getPolicyDetails(policyType);
        require(getPolicyOfCustomer(true, msg.sender).length == 0, "customer has active flight policy");
        require(msg.value >= policyDetails.premium, "Not enough ether to purhcase plan");
        require(departureTime > block.timestamp, "Flight is not a future flight");
        uint256 policyId = flightPolicyInstance.purchasePolicy(policyType, flight, departureTime, msg.sender);
        flightPolicyHolders[msg.sender] = policyId;
        emit PolicyBought(policyId);
    }

    function claimPolicy() public holderOnly {
        uint256 lastPolicyBought = flightPolicyHolders[msg.sender];
        FlightPolicy.policy memory policyData = flightPolicyInstance.getPolicyOfInsured(msg.sender)[lastPolicyBought - 1];

        require(policyData.status == FlightPolicy.PolicyStatus.Active, "Policy has been claimed or has expired");
        uint256 totalPayout = policyData.delayPayout;
        // TODO: Request flight status from oracle, multiply totalpayout with units of hours delayed
        
        // Process payout
        if (totalPayout > policyData.maxPayout) {
            totalPayout = policyData.maxPayout;
        }
        
        // Transfer payout to policyholder
        payable(policyData.insured).transfer(totalPayout);

        //if payout has reached maximum payout
        flightPolicyInstance.markAsClaimed(msg.sender);
        emit Payout(totalPayout, policyData.insured);
    }

    function addNewFlight(string memory flight, uint256 departureTime) public holderOnly() {
        require(departureTime > block.timestamp, "Flight has already been scheduled to take off and cannot be added");
        flightPolicyInstance.addFlightDetails(flight, departureTime, msg.sender, flightPolicyHolders[msg.sender]);
        emit FlightAdded(flight, departureTime);
    }

    function getPolicyOfCustomer(bool isActive, address policyHolder) public returns (FlightPolicy.policy[] memory)  {
        FlightPolicy.policy[] memory policies = flightPolicyInstance.getPolicyOfInsured(msg.sender);
        uint256 numPolicies = policies.length;
        FlightPolicy.policy[] memory result = new FlightPolicy.policy[](numPolicies);
        if (policies.length == 0) {
            return result;
        }
        FlightPolicy.policy memory lastPolicy = policies[flightPolicyHolders[policyHolder]];
        if (isActive) {
            if (lastPolicy.status == FlightPolicy.PolicyStatus.Active) {
                result[0] = lastPolicy;
            }
        } 
        else {
            result = policies;
            if (lastPolicy.status == FlightPolicy.PolicyStatus.Active) {
                FlightPolicy.policy[] memory updatedResult = new FlightPolicy.policy[](numPolicies - 1);
                for (uint256 i = 0; i < numPolicies - 1; i++) {
                    updatedResult[i] = policies[i];
                }
                return updatedResult;
            }
        }
        return result;
    }

    function getCompanyPolicies(bool onlyDiscontinued) public view returns (FlightPolicy.policy[] memory) {
        FlightPolicy.policy[] memory policies = flightPolicyInstance.getAllPolicyTypes();
        if (onlyDiscontinued) {
            FlightPolicy.policy[] memory result = new FlightPolicy.policy[](policies.length);
            //1-based array
            uint256 count = 0;
            for (uint256 i = 1; i < policies.length; i++){
                if(policies[i].status == FlightPolicy.PolicyStatus.Discontinued) {
                    result[count] = policies[i];
                    count += 1;
                }
            }
            return result;
        }
        return policies;
    }
    
    function withdrawFunds(uint256 amount) external payable companyOnly() {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(company).transfer(amount * 1 ether);
    }

    receive() external payable {}

    function isCompany() public view returns (bool) {
        return company == msg.sender;
    }
}
