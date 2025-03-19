// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FlightPolicy { 
    
    address immutable companyContract;

    enum PolicyStatus {
        Active,
        Expired,
        Claimed,
        Discontinued
    }

    struct policy {
        uint policyId; // Starting from 1, represents number of policies the customer has
        uint256 numFlights;
        string[] flightNumbers;
        uint256[] departureTimes;
        uint256 creationDate;
        uint256 activeDuration; //number of days the policy will cover u for
        uint256 premium; // premiums are paid in full
        uint256 delayPayout; //per unit of hours delayed
        uint256 delayThreshold; //number here is 1 unit of hour delayed
        uint256 payoutToDate; //keeps track of amount of payout given during the activeDuration
        uint256 maxPayout; //this also represents the maximum amount of payout that can be given for cancelled flight
        address insured;
        address insurer;
        PolicyStatus status; //every customer can only have 1 active flight policy plan
    }

    //create Policies
    uint256 numPolicyTypes = 0;
    mapping(address => policy[]) public policyHolders; //policy[] is 0-based
    policy[] policyTypes; // 0-based

    constructor() {
        companyContract = msg.sender;
    }

    modifier companyOnly() {
        require(msg.sender == companyContract, "Policy, Only the owner can call this function");
        _;
    }

    function createPolicy(uint256 premium, uint256 delayPayout, uint256 maxPayout, uint256 delayThreshold, uint256 activeDuration) public companyOnly returns (uint256) {
        //create new policy
        string[] memory flightNumbers;
        uint256[] memory departureTimes;
        policy memory newPolicy = policy(0, 0, flightNumbers, departureTimes, 0, activeDuration, (premium * 1 ether), (delayPayout * 1 ether),  
                                        delayThreshold, 0 ether, (maxPayout * 1 ether), address(0), msg.sender, PolicyStatus.Active);
        policyTypes.push(newPolicy); 
        numPolicyTypes += 1;
        return numPolicyTypes;
    }

    function deletePolicy(uint256 policyTypeId) public companyOnly view {
        policy memory currPolicy = policyTypes[policyTypeId - 1];
        currPolicy.status = PolicyStatus.Discontinued;
    }

    function purchasePolicy(uint256 policyType, string memory flightNumber, uint256 departureTime, address policyHolder) public returns (uint256) {
        require(policyType <= numPolicyTypes && policyType != 0, "Invalid policy type");

        //new policy object
        uint256 policyId = policyHolders[policyHolder].length + 1;
        policy storage newPolicy = policyTypes[policyType - 1];
        newPolicy.policyId = policyId;
        newPolicy.numFlights = 1;
        newPolicy.flightNumbers.push(flightNumber);
        newPolicy.departureTimes.push(departureTime);
        newPolicy.creationDate = block.timestamp;
        newPolicy.insured = policyHolder;
        newPolicy.insurer = msg.sender;
        policyHolders[policyHolder].push(newPolicy);
        return policyId;
    }

    function addFlightDetails(string memory flightNumber, uint256 departureTime, address policyHolder, uint256 policyIndex) public companyOnly {
        policy storage currPolicy = policyHolders[policyHolder][policyIndex - 1];
        require(currPolicy.status == FlightPolicy.PolicyStatus.Active, "Policy has been claimed or has expired");
        currPolicy.numFlights += 1;
        currPolicy.flightNumbers.push(flightNumber);
        currPolicy.departureTimes.push(departureTime);
    }

    function getPolicyOfInsured(address insured) public companyOnly returns (policy[] memory) {
        if (policyHolders[insured].length > 0) {
            updatePolicyStatus(policyHolders[insured][policyHolders[insured].length - 1]);
        }
        return policyHolders[insured];
    }

    function getAllPolicyTypes() public view companyOnly returns (policy[] memory) {
        return policyTypes;
    }

    function getPolicyDetails(uint256 policyType) public view returns (policy memory) {
        return policyTypes[policyType - 1];
    }

    function markAsClaimed(address insured) public companyOnly {
        require(policyHolders[insured].length > 0, "No policies available");
        policy storage currPolicy = policyHolders[insured][policyHolders[insured].length - 1];
        currPolicy.status = PolicyStatus.Claimed;
    }

    function updatePolicyStatus(policy storage p) internal {
    if (p.status == PolicyStatus.Active && block.timestamp >= p.creationDate + (p.activeDuration * 1 days)) {
        p.status = PolicyStatus.Expired;
    }
}
}
