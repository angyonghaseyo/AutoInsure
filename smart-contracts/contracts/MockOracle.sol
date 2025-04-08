// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/ChainlinkRequestInterface.sol";

contract MockOracle {
    LinkTokenInterface internal linkToken;

    struct Request {
        address requester;
        bytes4 callbackFunctionId;
        bool fulfilled;
        uint256 fee;
        bytes32 jobId;
    }

    // Store Each Request
    mapping(bytes32 => Request) public requests;

    // Emit Request Event for Off Chain Listener
    event OracleRequest(
        bytes32 indexed requestId,
        address indexed oracleAddress,
        string url,
        string path
    );

    event OracleResponse(
        bytes32 indexed requestId,
        uint256 data
    );

    constructor(address _linkToken) {
        linkToken = LinkTokenInterface(_linkToken);
    }

    // Simulate Chainlink Request to oracle (Returns Nothing Cause Async)
    function mockChainlinkRequest(
        address _callbackAddress,
        bytes4 _callbackFunctionId,
        uint256 fee,
        bytes32 jobId,
        string memory url,
        string memory path // eg data.delayMinutes
    ) public returns (bytes32 requestID) {
        // Generate a new request ID
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, block.timestamp, url));

        // Generate request in mapping
        requests[requestId] = Request({
            requester: _callbackAddress,
            callbackFunctionId: _callbackFunctionId,
            fulfilled: false,
            fee: fee,
            jobId: jobId
        });

        // Emit Function for Off ChainListener
        emit OracleRequest(requestId, address(this), url, path);

        // Return Request ID for Oracle Connector
        return requestId;
    }

    /// Fulfilled using off-chain listener calling back with real data
    function fulfillDataFromOffChain(bytes32 requestId, uint256 data) external {
        Request storage req = requests[requestId];
        require(!req.fulfilled, "Request already fulfilled");
        // set request to fulfilled
        req.fulfilled = true;

        // Call back the requester with the data
        (bool success, ) = req.requester.call(
            abi.encodeWithSelector(req.callbackFunctionId, requestId, data)
        );
        require(success, "Callback failed");

        emit OracleResponse(requestId, data);
    }

    modifier onlyLINK() {
        require(msg.sender == address(linkToken), "Must use LINK token");
        _;
    }
}
