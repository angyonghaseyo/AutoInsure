// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockLinkToken is ERC20 {
    constructor() ERC20("Mock LINK", "mLINK") {
        _mint(msg.sender, 1000000 * 10**18); // Mint 1,000,000 LINK
    }
    
    function transferAndCall(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public returns (bool success) {
        super.transfer(_to, _value);
        
        if (isContract(_to)) {
            contractFallback(_to, _value, _data);
        }
        
        return true;
    }
    
    function contractFallback(
        address _to,
        uint256 _value,
        bytes memory _data
    ) private {
        (bool success, ) = _to.call(
            abi.encodeWithSignature(
                "onTokenTransfer(address,uint256,bytes)",
                msg.sender,
                _value,
                _data
            )
        );
        require(success, "Token transfer failed");
    }
    
    function isContract(address _addr) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_addr)
        }
        return size > 0;
    }
}
