// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OracleConnector
 * @dev Contract that connects to Chainlink oracles to fetch flight data
 */
contract OracleConnector is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;
    
    // Oracle parameters
    struct OracleInfo {
        address oracle;
        string oracleAPIUrl;
        bytes32 jobId;
    }

    OracleInfo[] public oracles;
    uint256 private fee;
    
    // Flight data storage
    struct FlightData {
        string flightNumber;
        string departureTime; // refering to original departure
        bool isDelayed; 
        uint256 delaySum; // total delay time responded by oracle
        uint256 delayMinutes;
        uint256 delayHours;
        bool dataReceived; // track whether final data processed alr
        uint256 responseCount; // track number of oracles responded
        uint256 avgDelay; // computed avg delay after aggregation
        mapping(address => bool) respondedOracles; // track which oracles responded
    }

    // delayThreshold in minutes
    uint256 delayThreshold = 60; 
    
    // Mapping from request ID to flight data
    mapping(bytes32 => string) private requestToFlightNumber;
    mapping(bytes32 => string) private requestToDepartureTime;
    mapping(string => mapping(string => FlightData)) private flightDataStore;
    
    // Events
    event FlightDataRequested(bytes32 indexed requestId, string flightNumber, string departureTime);
    event FlightDataReceived(bytes32 indexed requestId, string flightNumber, string departureTime, bool isDelayed, uint256 delayMinutes);
    
    constructor(address _linkToken) Ownable() {
        // Set Chainlink token address (for the relevant network)
        setChainlinkToken(_linkToken);

        
        // Below Comments for Sepolia Testing
        // This is Sepolia testnet LINK token address
        //setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);
        
        // oracles.push(OracleInfo(
        //     0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD, //  Chainlink node operator on Sepolia
        //     "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/", // mock api url
        //     "7d80a6386ef543a3abb52817f6707e3b" // JobID for flight data API request
        // ));

        // 0.1 LINK
        fee = 0.1 * 10 ** 18;
    }

    function addOracle(address _oracle, string memory _oracleAPIUrl, bytes32 _jobId) external onlyOwner {
        oracles.push(OracleInfo({oracle: _oracle, oracleAPIUrl: _oracleAPIUrl, jobId: _jobId}));
    }
    
    // /**
    //  * @dev Request flight data from Chainlink oracle
    //  * @param _flightNumber Flight number (e.g., "AA123")
    //  * @param _departureTime Unix timestamp of scheduled departure
    //  * @return requestId Chainlink request ID
    //  */
    function requestFlightData(string memory _flightNumber, string memory _departureTime) public returns (bytes32 requestId) 
    {
        require(oracles.length > 0, "No oracles set");

        for (uint256 i = 0; i < oracles.length; i++) {
            Chainlink.Request memory request = buildChainlinkRequest(
                oracles[i].jobId,
                address(this),
                this.fulfillFlightData.selector
            );
            
            // Set the URL to fetch flight data
            // Note: This URL called from each indiv oracle api 
            string memory fullUrl = string(abi.encodePacked(
                oracles[i].oracleAPIUrl,
                _flightNumber,
                "?departure=",
                _departureTime
            ));
            request.add("get", fullUrl);
            
            // Set the path to find the flight delay data 
            request.add("path", "data.delayMinutes");
            
            // Send the request to oracle address
            requestId = sendChainlinkRequestTo(oracles[i].oracle, request, fee);
            
            // Store request mapping
            requestToFlightNumber[requestId] = _flightNumber;
            requestToDepartureTime[requestId] = _departureTime;
            
            emit FlightDataRequested(requestId, _flightNumber, _departureTime);
        }
        
        return requestId;
    }

    // /*
    //  * @dev Callback function for Chainlink oracle response (async called by each oracle ie msg.sender is oracle)
    //  * @param _requestId The request ID
    //  * @param _isDelayed Whether the flight is delayed
    //  * @param _delayMinutes The number of minutes the flight is delayed
    //  */
    function fulfillFlightData(bytes32 _requestId, uint256 _delayMinutes) public recordChainlinkFulfillment(_requestId) {
        string memory flightNumber = requestToFlightNumber[_requestId];
        string memory departureTime = requestToDepartureTime[_requestId];

        FlightData storage data = flightDataStore[flightNumber][departureTime];

        require(!data.respondedOracles[msg.sender], "Oracle already responded"); // No double response per oracle
        
        data.delaySum += _delayMinutes; // since we only request for the delayMinutes from each oracle 
        data.responseCount++;
        data.respondedOracles[msg.sender] = true;

        if (data.responseCount == oracles.length) {
            uint256 avgDelay = data.delaySum / data.responseCount;
            data.delayMinutes = avgDelay;
            data.delayHours = avgDelay / 60;
            data.dataReceived = true;

            if (avgDelay >= delayThreshold) {
                data.isDelayed = true;
            } 
            else {
                data.isDelayed = false;
            }

            emit FlightDataReceived(_requestId, flightNumber, departureTime, data.isDelayed, data.delayMinutes);
        }
    }
        
    // /**
    //  * @dev Get flight status (cached or new request if not available)
    //  * @param _flightNumber Flight number
    //  * @param _departureTime Departure time
    //  * @return isDelayed Whether the flight is delayed
    //  * @return delayMinutes The number of minutes the flight is delayed
    //  */
    function getFlightStatus(string memory _flightNumber, string memory _departureTime) public
    returns (bool isDelayed, uint256 delayHours)
    {
        FlightData storage data = flightDataStore[_flightNumber][_departureTime];
        
        // If we already have the data, return it
        if (data.dataReceived) {
            return (data.isDelayed, data.delayHours);
        } 

        requestFlightData(_flightNumber, _departureTime);
        return (false, 0);  // Added for testing purposes 
        FlightData storage new_data = flightDataStore[_flightNumber][_departureTime];
        return (new_data.isDelayed, new_data.delayHours);
    }
        
    function checkFlightStatus(string memory _flightNumber, string memory _departureTime) public view
    returns (bool dataReceived, bool isDelayed, uint256 delayHours)
    {
        FlightData storage data = flightDataStore[_flightNumber][_departureTime];
        return (data.dataReceived, data.isDelayed, data.delayHours);
    }
    
    /**
     * @dev Update Chainlink oracle parameters
     * @param _oracle New oracle address
     * @param _jobId New job ID
     * @param _fee New fee amount
     */
    // function updateOracleParams(address _oracle, bytes32 _jobId, uint256 _fee)
    //     external
    //     onlyOwner
    //     {
    //         oracle = _oracle;
    //         jobId = _jobId;
    //         fee = _fee;
    //     }
        
    /**
     * @dev Withdraw LINK tokens from the contract
     */
    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }

}