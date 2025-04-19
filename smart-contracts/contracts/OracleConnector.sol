// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


interface IMockOracle {
    function mockChainlinkRequest(
        address _callbackAddress,
        bytes4 _callbackFunctionId,
        uint256 fee,
        bytes32 jobId,
        string memory url,
        string memory path
    ) external returns (bytes32);
}


contract OracleConnector is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;
    
    // Oracle parameters
    struct OracleInfo {
        address oracle;
        string oracleAPIUrl;
        bytes32 jobId;
    }

    struct BaggageRequest {
        string flightNumber;
        string departureTime;
        string itemDescription;
    }

    struct BaggageData {
        string itemDescription;
        bool baggageStatus;
        bool dataReceived;
        string flightNumber;
        string departureTime; // refering to original departure
    }
    
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


    OracleInfo[] public oracles;
    uint256 private fee;
    bytes32 constant flightJobId = 0x666c696768745f6f7261636c6500000000000000000000000000000000000000;
    bytes32 constant baggageJobId = 0x626167676167655f6f7261636c65000000000000000000000000000000000000;
    // delayThreshold in minutes
    uint256 delayThreshold = 60; 
    
    // Mapping from request ID to flight data
    mapping(bytes32 => string) private requestToFlightNumber;
    mapping(bytes32 => string) private requestToDepartureTime;
    mapping(bytes32 => BaggageRequest) private requestIDToBaggageRequest;
    mapping(string => mapping(string => FlightData)) private flightDataStore;
    mapping(string => mapping(string => mapping(string => BaggageData))) private baggageDataStore;
    
    // Events
    event FlightDataRequested(bytes32 indexed requestId, string flightNumber, string departureTime);
    event FlightDataReceived(bytes32 indexed requestId, string flightNumber, string departureTime, bool isDelayed, uint256 delayMinutes);

    event BaggageDataRequested(bytes32 indexed requestId, string flightNumber, string departureTime, string itemDescription);
    event BaggageDataRecieved(bytes32 indexed requestId, string flightNumber, string departureTime, string itemDescription, uint256 retrievedBaggageStatus);

    
    constructor(address _linkToken) Ownable() {
        // Set Chainlink token address (for the relevant network)
        setChainlinkToken(_linkToken);
        // 0.1 LINK
        fee = 0.1 * 10 ** 18;
    }

    function addOracle(address _oracle, string memory _oracleAPIUrl, bytes32 _jobId) external onlyOwner {
        oracles.push(OracleInfo({oracle: _oracle, oracleAPIUrl: _oracleAPIUrl, jobId: _jobId}));
    }

    function requestFlightData(string memory _flightNumber, string memory _departureTime) public returns (bytes32 requestId) 
    {
        // require(oracles.length > 0, "No oracles set");

        for (uint256 i = 0; i < oracles.length; i++) {

            if (flightJobId != oracles[i].jobId) {
                continue;
            } 
            // Set the URL to fetch flight data
            //This URL called from each indiv oracle api 
            string memory fullUrl = string(abi.encodePacked(
                oracles[i].oracleAPIUrl,
                _flightNumber,
                "?departure=",
                _departureTime
            ));

            // Call Mock Oracle Function instead to simulate chainlink sending a request
            requestId = IMockOracle(oracles[i].oracle).mockChainlinkRequest(
                address(this),
                this.fulfillFlightData.selector,
                fee,
                oracles[i].jobId, // example jobId
                fullUrl,
                "delayMinutes"
            );
            
            // Store request mapping
            requestToFlightNumber[requestId] = _flightNumber;
            requestToDepartureTime[requestId] = _departureTime;
            
            // Initialize the flight data structure if it doesn't exist
            if (flightDataStore[_flightNumber][_departureTime].responseCount == 0) {
                flightDataStore[_flightNumber][_departureTime].flightNumber = _flightNumber;
                flightDataStore[_flightNumber][_departureTime].departureTime = _departureTime;
            }
            
            emit FlightDataRequested(requestId, _flightNumber, _departureTime);
        }
        
        return requestId;
    }

    // Modified for testing purposes to handle the MockOracle response
    function fulfillFlightData(bytes32 _requestId, uint256 _delayMinutes) public {
        // Skip the recordChainlinkFulfillment modifier for testing
        // Only verify basic requirements
        
        string memory flightNumber = requestToFlightNumber[_requestId];
        string memory departureTime = requestToDepartureTime[_requestId];
        
        // Make sure this is a valid request
        require(bytes(flightNumber).length > 0, "Invalid request ID");

        FlightData storage data = flightDataStore[flightNumber][departureTime];

        // // Skip the check for double responses in testing
        // if (data.respondedOracles[msg.sender]) {
        //     // If already responded, just return
        //     return;
        // }
        
        data.delaySum += _delayMinutes;
        data.responseCount++;
        data.respondedOracles[msg.sender] = true;

        // For testing, we'll consider the data received if at least one oracle responds
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
        
    function getFlightStatus(string memory _flightNumber, string memory _departureTime) public
    returns (bool dataReceived, bool isDelayed, uint256 delayHours)
    {
        FlightData storage data = flightDataStore[_flightNumber][_departureTime];
        
        // If we already have the data, return it
        if (data.dataReceived) {
            return (data.dataReceived, data.isDelayed, data.delayHours);
        } 

        requestFlightData(_flightNumber, _departureTime);
        return (data.dataReceived, data.isDelayed, data.delayHours);
    }
        
    function checkFlightStatus(string memory _flightNumber, string memory _departureTime) public view
    returns (bool dataReceived, bool isDelayed, uint256 delayHours)
    {
        FlightData storage data = flightDataStore[_flightNumber][_departureTime];
        return (data.dataReceived, data.isDelayed, data.delayHours);
    }
    
    function requestBaggageData(string memory _flightNumber, string memory _departureTime, string memory _itemDescription) 
    public returns (bytes32 requestId) 
    {
        require(oracles.length > 0, "No oracles set");

        for (uint256 i = 0; i < oracles.length; i++) {

            if (baggageJobId != oracles[i].jobId) {
                continue;
            } 
            // Set the URL to fetch flight data
            //This URL called from each indiv oracle api 
            string memory fullUrl = string(abi.encodePacked(
                oracles[i].oracleAPIUrl,
                _flightNumber,
                "?departure=",
                _departureTime,
                "/",
                _itemDescription
            ));

            // Call Mock Oracle Function instead to simulate chainlink sending a request
            requestId = IMockOracle(oracles[i].oracle).mockChainlinkRequest(
                address(this),
                this.fulfillBaggageData.selector,
                fee,
                oracles[i].jobId, // example jobId
                fullUrl,
                "baggageStatus"
            );
            
            // Store request mapping
            requestIDToBaggageRequest[requestId] = BaggageRequest(_flightNumber, _departureTime, _itemDescription);
            
            // Initialize the data structure if it doesn't exist
            baggageDataStore[_flightNumber][_departureTime][_itemDescription].flightNumber = _flightNumber;
            baggageDataStore[_flightNumber][_departureTime][_itemDescription].departureTime = _departureTime;
            baggageDataStore[_flightNumber][_departureTime][_itemDescription].itemDescription = _itemDescription;
            
            emit BaggageDataRequested(requestId, _flightNumber, _departureTime, _itemDescription);
        }

            
        return requestId;
    }

    function fulfillBaggageData(bytes32 _requestId, uint256 _baggageStatus) public {        
        BaggageRequest storage baggage = requestIDToBaggageRequest[_requestId];
        string memory flightNumber = baggage.flightNumber;
        string memory departureTime = baggage.departureTime;
        string memory itemDescription = baggage.itemDescription;

        // Make sure this is a valid request
        require(bytes(itemDescription).length > 0, "Invalid request ID");

        BaggageData storage data = baggageDataStore[flightNumber][departureTime][itemDescription];

        data.dataReceived = true;
        if (_baggageStatus == 0) {
            data.baggageStatus = false;
        } else {
            data.baggageStatus = true;
        }
        emit BaggageDataRecieved(_requestId, flightNumber, departureTime, itemDescription, _baggageStatus);
    }

    function getBaggageStatus(string memory _flightNumber, string memory _departureTime, string memory _itemDescription) public
    returns (bool dataReceived, bool baggageStatus)
    {
        BaggageData storage data = baggageDataStore[_flightNumber][_departureTime][_itemDescription];
        
        // If we already have the data, return it
        if (data.dataReceived) {
            return (data.dataReceived, data.baggageStatus);
        }

        requestBaggageData(_flightNumber, _departureTime, _itemDescription);
        return (data.dataReceived, data.baggageStatus);
    }
    
    function checkBaggageStatus(string memory _flightNumber, string memory _departureTime, string memory _itemDescription) public view
    returns (bool dataReceived, bool baggageStatus)
    {
        BaggageData storage data = baggageDataStore[_flightNumber][_departureTime][_itemDescription];
        return (data.dataReceived, data.baggageStatus);
    }
    
    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }

}
