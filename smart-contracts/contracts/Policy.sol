// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Policy { 
    
    address immutable companyContract;

    struct policy {
        uint policyTypeId; // 1-based
        string flightNumber;
        uint256 departureTime;
        uint256 creationDate;
        uint256 premium;
        uint256 delayPayout; //per unit of hours delayed
        uint256 numHoursDelay; //number here is 1 unit of hour delayed
        uint256 maxPayout; //this also represents the maximum amount of payout that can be given for cancelled flight
        bool isClaimed;
        bool isDiscontinued;
        address insured;
        address insurer;
    }

    //create Policies
    uint256 numPolicies = 0;
    uint256 numPolicyTypes = 0;
    mapping(address => policy) public activePolicies;
    mapping(uint256 => policy) public policyTypes;

    constructor() {
        companyContract = msg.sender;
    }

    modifier companyOnly() {
        require(msg.sender == companyContract, "Policy, Only the owner can call this function");
        _;
    }

    function createPolicy(uint256 premium, uint256 delayPayout, uint256 maxPayout) public companyOnly returns (uint256) {
        //create new policy
        numPolicyTypes += 1;
        policy memory newPolicy = policy(numPolicyTypes, "0", 0, 0, (premium * 1 ether), (delayPayout * 1 ether),  
                                        2, (maxPayout * 1 ether), false, false, address(0), msg.sender);
        policyTypes[numPolicyTypes] = newPolicy;
        return numPolicyTypes;
    }

    function deletePolicy(uint256 policyTypeId) public companyOnly view returns (bool) {
        policy memory currPolicy = policyTypes[policyTypeId];
        currPolicy.isDiscontinued = true;
        return currPolicy.isDiscontinued;
    }

    function purchasePolicy(uint256 policyType, string memory flight, address policyHolder) public {
        require(policyType <= numPolicyTypes && policyType != 0, "Invalid policy type");

        //new policy object
        policy memory newPolicy = policyTypes[policyType];
        newPolicy.flightNumber = flight;
        newPolicy.creationDate = block.timestamp;
        newPolicy.insured = policyHolder;
        newPolicy.insurer = msg.sender;
        
        numPolicies += 1;
        activePolicies[policyHolder] = newPolicy;
    }

    function getPolicyOfInsured(address insured) public view companyOnly returns (policy memory) {
        return activePolicies[insured];
    }

    function getPolicyDetails(uint256 policyType) public view returns (policy memory) {
        return policyTypes[policyType];
    }

    function markAsClaimed(address insured) public companyOnly {
        activePolicies[insured].isClaimed = true;
    }
}
