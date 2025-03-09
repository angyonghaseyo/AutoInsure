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
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    
    // Flight data storage
    struct FlightData {
        string flightNumber;
        uint256 departureTime;
        bool isDelayed;
        uint256 delayMinutes;
        bool dataReceived;
    }
    
    // Mapping from request ID to flight data
    mapping(bytes32 => string) private requestToFlightNumber;
    mapping(bytes32 => uint256) private requestToDepartureTime;
    mapping(string => mapping(uint256 => FlightData)) private flightDataStore;
    
    // Events
    event FlightDataRequested(bytes32 indexed requestId, string flightNumber, uint256 departureTime);
    event FlightDataReceived(bytes32 indexed requestId, string flightNumber, uint256 departureTime, bool isDelayed, uint256 delayMinutes);
    
    constructor() Ownable(msg.sender) {
        // Set Chainlink token address (for the relevant network)
        // This is Sepolia testnet LINK token address
        setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);
        
        // Set Chainlink Oracle address
        // This is a Chainlink node operator on Sepolia
        oracle = 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD;
        
        // JobID for flight data API request
        jobId = "7d80a6386ef543a3abb52817f6707e3b";
        
        // 0.1 LINK
        fee = 0.1 * 10 ** 18;
    }
    
    /**
     * @dev Request flight data from Chainlink oracle
     * @param _flightNumber Flight number (e.g., "AA123")
     * @param _departureTime Unix timestamp of scheduled departure
     * @return requestId Chainlink request ID
     */
    function requestFlightData(string memory _flightNumber, uint256 _departureTime) 
        public
        returns (bytes32 requestId) 
    {
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillFlightData.selector
        );
        
        // Set the URL to fetch flight data
        // Note: This URL would be replaced with an actual flight data API
        request.add("get", string(abi.encodePacked(
            "https://api.flightdata.example/flight/",
            _flightNumber,
            "?departure=",
            uint2str(_departureTime)
        )));
        
        // Set the path to find the flight delay data
        request.add("path", "data,isDelayed");
        request.add("path", "data,delayMinutes");
        
        // Send the request
        requestId = sendChainlinkRequestTo(oracle, request, fee);
        
        // Store request mapping
        requestToFlightNumber[requestId] = _flightNumber;
        requestToDepartureTime[requestId] = _departureTime;
        
        emit FlightDataRequested(requestId, _flightNumber, _departureTime);
        
        return requestId;
    }
    
    /**
     * @dev Callback function for Chainlink oracle response
     * @param _requestId The request ID
     * @param _isDelayed Whether the flight is delayed
     * @param _delayMinutes The number of minutes the flight is delayed
     */
    function fulfillFlightData(
        bytes32 _requestId,
        bool _isDelayed,
        uint256 _delayMinutes
    ) 
        public
        recordChainlinkFulfillment(_requestId)
    {
        string memory flightNumber = requestToFlightNumber[_requestId];
        uint256 departureTime = requestToDepartureTime[_requestId];
        
        // Store flight data
        FlightData storage data = flightDataStore[flightNumber][departureTime];
        data.flightNumber = flightNumber;
        data.departureTime = departureTime;
        data.isDelayed = _isDelayed;
        data.delayMinutes = _delayMinutes;
        data.dataReceived = true;
        
        emit FlightDataReceived(_requestId, flightNumber, departureTime, _isDelayed, _delayMinutes);
    }
    
    /**
     * @dev Get flight status (cached or new request if not available)
     * @param _flightNumber Flight number
     * @param _departureTime Departure time
     * @return isDelayed Whether the flight is delayed
     * @return delayMinutes The number of minutes the flight is delayed
     */
    function getFlightStatus(string memory _flightNumber, uint256 _departureTime)
        external
        returns (bool isDelayed, uint256 delayMinutes)
    {
        FlightData storage data = flightDataStore[_flightNumber][_departureTime];
        
        // If we already have the data, return it
        if (data.dataReceived) {
            return (data.isDelayed, data.delayMinutes);
        }
        
        // Otherwise, request it
        requestFlightData(_flightNumber, _departureTime);
        
        // For simplicity in this example, we'll return a default value
        // In a real implementation, you would need to handle waiting for the oracle response
        return (false, 0);
    }
    
    /**
     * @dev Get cached flight data without making a new request
     * @param _flightNumber Flight number
     * @param _departureTime Departure time
     * @return isDelayed Whether the flight is delayed
     * @return delayMinutes The number of minutes the flight is delayed
     * @return dataReceived Whether we have received data for this flight
     */
    function getCachedFlightData(string memory _flightNumber, uint256 _departureTime)
        external
        view
        returns (bool isDelayed, uint256 delayMinutes, bool dataReceived)
    {
        FlightData storage data = flightDataStore[_flightNumber][_departureTime];
        return (data.isDelayed, data.delayMinutes, data.dataReceived);
    }
    
    /**
     * @dev Update Chainlink oracle parameters
     * @param _oracle New oracle address
     * @param _jobId New job ID
     * @param _fee New fee amount
     */
    function updateOracleParams(address _oracle, bytes32 _jobId, uint256 _fee)
        external
        onlyOwner
    {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }
    
    /**
     * @dev Withdraw LINK tokens from the contract
     */
    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }
    
    /**
     * @dev Helper function to convert uint to string
     * @param _i The uint to convert
     * @return The string representation of the uint
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}