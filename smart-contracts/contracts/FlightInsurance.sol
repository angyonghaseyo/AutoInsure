// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./OracleConnector.sol";

/**
 * @title FlightInsurance
 * @dev A smart contract for decentralized flight delay insurance
 */
contract FlightInsurance is Ownable, ReentrancyGuard {
    // Policy struct to store insurance details
    struct Policy {
        uint256 policyId;
        address policyholder;
        string flightNumber;
        uint256 departureTime;
        uint256 premium;
        uint256 payoutAmount;
        bool isPaid;
        bool isClaimed;
        uint256 delayThreshold; // in minutes
        PolicyStatus status;
    }

    enum PolicyStatus {
        Active,
        Expired,
        Claimed,
        Cancelled
    }

    // Insurance parameters
    uint256 public minPremium = 0.01 ether;
    uint256 public maxPayout = 0.5 ether;
    uint256 public policyExpirationTime = 24 hours;
    uint256 public defaultDelayThreshold = 120 minutes; // 2 hours

    // Contract state variables
    uint256 private policyCounter;
    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public userPolicies;
    
    // Oracle connector for flight data
    OracleConnector public oracleConnector;

    // Events
    event PolicyPurchased(uint256 indexed policyId, address indexed policyholder, string flightNumber, uint256 departureTime);
    event PolicyClaimed(uint256 indexed policyId, address indexed policyholder, uint256 payoutAmount);
    event PolicyCancelled(uint256 indexed policyId, address indexed policyholder);
    event DelayThresholdUpdated(uint256 newThreshold);
    event OracleConnectorUpdated(address newConnector);
    
    // Modifiers
    modifier validPolicy(uint256 _policyId) {
        require(_policyId > 0 && _policyId <= policyCounter, "Invalid policy ID");
        _;
    }
    
    modifier onlyPolicyholder(uint256 _policyId) {
        require(policies[_policyId].policyholder == msg.sender, "Not the policyholder");
        _;
    }

    constructor(address _oracleConnector) Ownable(msg.sender) {
        oracleConnector = OracleConnector(_oracleConnector);
        policyCounter = 0;
    }

    /**
     * @dev Purchase a flight insurance policy
     * @param _flightNumber Flight number (e.g., "AA123")
     * @param _departureTime Unix timestamp of departure
     * @return policyId ID of the newly created policy
     */
    function purchasePolicy(string memory _flightNumber, uint256 _departureTime) 
        external 
        payable 
        nonReentrant 
        returns (uint256) 
    {
        require(msg.value >= minPremium, "Premium too low");
        require(_departureTime > block.timestamp, "Departure time must be in the future");
        
        // Calculate payout amount (3x premium, capped at maxPayout)
        uint256 payoutAmount = msg.value * 3;
        if (payoutAmount > maxPayout) {
            payoutAmount = maxPayout;
        }
        
        // Create new policy
        policyCounter++;
        Policy storage newPolicy = policies[policyCounter];
        newPolicy.policyId = policyCounter;
        newPolicy.policyholder = msg.sender;
        newPolicy.flightNumber = _flightNumber;
        newPolicy.departureTime = _departureTime;
        newPolicy.premium = msg.value;
        newPolicy.payoutAmount = payoutAmount;
        newPolicy.isPaid = false;
        newPolicy.isClaimed = false;
        newPolicy.delayThreshold = defaultDelayThreshold;
        newPolicy.status = PolicyStatus.Active;
        
        // Add policy to user's policies
        userPolicies[msg.sender].push(policyCounter);
        
        emit PolicyPurchased(policyCounter, msg.sender, _flightNumber, _departureTime);
        
        return policyCounter;
    }

    /**
     * @dev Claim a policy payout if flight was delayed
     * @param _policyId ID of the policy to claim
     */
    function claimPolicy(uint256 _policyId) 
        external 
        nonReentrant 
        validPolicy(_policyId) 
        onlyPolicyholder(_policyId) 
    {
        Policy storage policy = policies[_policyId];
        
        require(policy.status == PolicyStatus.Active, "Policy not active");
        require(!policy.isPaid, "Policy already paid out");
        require(!policy.isClaimed, "Policy already claimed");
        require(block.timestamp <= policy.departureTime + policyExpirationTime, "Policy expired");
        
        // Request flight status from oracle
        (bool isDelayed, uint256 delayMinutes) = oracleConnector.getFlightStatus(policy.flightNumber, policy.departureTime);
        
        require(isDelayed && delayMinutes >= policy.delayThreshold, "Flight not sufficiently delayed");
        
        // Process payout
        policy.isPaid = true;
        policy.isClaimed = true;
        policy.status = PolicyStatus.Claimed;
        
        emit PolicyClaimed(_policyId, msg.sender, policy.payoutAmount);
        
        // Transfer payout to policyholder
        (bool success, ) = payable(policy.policyholder).call{value: policy.payoutAmount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Cancel a policy before departure
     * @param _policyId ID of the policy to cancel
     */
    function cancelPolicy(uint256 _policyId) 
        external 
        nonReentrant 
        validPolicy(_policyId) 
        onlyPolicyholder(_policyId) 
    {
        Policy storage policy = policies[_policyId];
        
        require(policy.status == PolicyStatus.Active, "Policy not active");
        require(!policy.isPaid, "Policy already paid out");
        require(!policy.isClaimed, "Policy already claimed");
        require(block.timestamp < policy.departureTime, "Cannot cancel after departure");
        
        // Calculate refund (50% of premium)
        uint256 refundAmount = policy.premium / 2;
        
        // Update policy status
        policy.status = PolicyStatus.Cancelled;
        
        emit PolicyCancelled(_policyId, msg.sender);
        
        // Transfer refund to policyholder
        (bool success, ) = payable(policy.policyholder).call{value: refundAmount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Get all policies purchased by a user
     * @param _user Address of the user
     * @return Array of policy IDs
     */
    function getPoliciesByUser(address _user) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }

    /**
     * @dev Get policy details
     * @param _policyId ID of the policy
     * @return Policy details
     */
    function getPolicyDetails(uint256 _policyId) 
        external 
        view 
        validPolicy(_policyId) 
        returns (Policy memory) 
    {
        return policies[_policyId];
    }

    /**
     * @dev Update the delay threshold
     * @param _newThreshold New threshold in minutes
     */
    function updateDelayThreshold(uint256 _newThreshold) external onlyOwner {
        defaultDelayThreshold = _newThreshold;
        emit DelayThresholdUpdated(_newThreshold);
    }

    /**
     * @dev Update the oracle connector
     * @param _newConnector Address of the new oracle connector
     */
    function updateOracleConnector(address _newConnector) external onlyOwner {
        oracleConnector = OracleConnector(_newConnector);
        emit OracleConnectorUpdated(_newConnector);
    }

    /**
     * @dev Withdraw contract funds (only owner)
     * @param _amount Amount to withdraw
     */
    function withdrawFunds(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: _amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Receive function to accept Ether
     */
    receive() external payable {}
}