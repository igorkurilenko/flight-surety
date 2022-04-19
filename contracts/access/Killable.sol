// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Killable is Ownable {
    function kill() external onlyOwner {
        selfdestruct(payable(owner()));
    }
}
