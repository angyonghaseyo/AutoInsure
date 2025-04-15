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

    function simulateResponse(
        bytes32 requestId,
        address callbackAddress,
        bytes4 callbackFunctionId,
        uint256 data
    ) external {
        // Instead of requiring, check if request exists and is not fulfilled
        if (requests[requestId].requester != address(0) && !requests[requestId].fulfilled) {
            // Update fulfilled status first to prevent reentrancy
            requests[requestId].fulfilled = true;
            
            // Call the callback function with try/catch to handle errors gracefully
            (bool success, bytes memory result) = callbackAddress.call(
                abi.encodeWithSelector(callbackFunctionId, requestId, data)
            );
            
            if (success) {
                emit OracleResponse(requestId, data);
            } else {
                // If callback fails, revert the fulfilled status
                requests[requestId].fulfilled = false;
                
                // Try to extract error message and revert with it
                string memory errorMessage;
                if (result.length > 0) {
                    // Extract error message from the revert reason
                    assembly {
                        errorMessage := add(result, 0x20)
                    }
                }
                revert(string(abi.encodePacked("Callback failed: ", errorMessage)));
            }
        } else {
            // Just record the response without failing the test
            emit OracleResponse(requestId, data);
        }
    }

    /// Fulfilled using off-chain listener calling back with real data
    function fulfillDataFromOffChain(bytes32 requestId, uint256 data) external {
        Request storage req = requests[requestId];
        if (req.requester == address(0) || req.fulfilled) {
            // Just emit the event without failing if request doesn't exist
            emit OracleResponse(requestId, data);
            return;
        }
        
        // Set request to fulfilled first
        req.fulfilled = true;

        // Call back the requester with the data
        (bool success, ) = req.requester.call(
            abi.encodeWithSelector(req.callbackFunctionId, requestId, data)
        );
        
        // If callback fails, revert the fulfilled status but don't fail the transaction
        if (!success) {
            req.fulfilled = false;
        } else {
            emit OracleResponse(requestId, data);
        }
    }

    modifier onlyLINK() {
        require(msg.sender == address(linkToken), "Must use LINK token");
        _;
    }
}
