// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/ChainlinkRequestInterface.sol";

contract MockChainlinkOracle {
    LinkTokenInterface internal linkToken;
    
    struct Request {
        address requester;
        bytes4 callbackFunctionId;
        uint256 randomness;
        uint256 fee;
        bytes32 jobId;
    }
    
    mapping(bytes32 => Request) private requests;
    
    event ChainlinkRequested(bytes32 indexed id);
    
    constructor(address _linkToken) {
        linkToken = LinkTokenInterface(_linkToken);
    }
    
    function onTokenTransfer(
        address _sender,
        uint256 _amount,
        bytes memory _data
    ) public onlyLINK {
        emit ChainlinkRequested(keccak256(_data));
    }
    
    function fulfillOracleRequest(
        bytes32 _requestId,
        address _callbackAddress,
        bytes4 _callbackFunctionId,
        uint256 _nonce,
        uint256 _result
    ) public returns (bool) {
        (bool success, ) = _callbackAddress.call(
            abi.encodeWithSelector(_callbackFunctionId, _requestId, _result)
        );
        return success;
    }
    
    // Helper function to simulate a response
    function simulateResponse(
        bytes32 _requestId,
        address _callbackAddress,
        bytes4 _callbackFunctionId,
        uint256 _delayMinutes
    ) external returns (bool) {
        return fulfillOracleRequest(
            _requestId,
            _callbackAddress,
            _callbackFunctionId,
            0,
            _delayMinutes
        );
    }
    
    modifier onlyLINK() {
        require(msg.sender == address(linkToken), "Must use LINK token");
        _;
    }
}