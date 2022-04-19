// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Escrow {
    using SafeMath for uint256;

    event DidDeposit(address indexed payee, uint256 weiAmount);
    event DidWithdraw(address indexed payee, uint256 weiAmount);

    mapping(address => uint256) private _deposits;

    function depositsOf(address payee) public view returns (uint256) {
        return _deposits[payee];
    }

    function _deposit(address payee, uint256 amount) internal {
        (bool ok, uint sum) = _deposits[payee].tryAdd(amount);

        require(ok, "Falied to deposit");

        _deposits[payee] = sum;

        emit DidDeposit(payee, amount);
    }

    function _withdraw(address payee) internal {
        uint256 payment = _deposits[payee];
        delete _deposits[payee];

        payable(payee).transfer(payment);

        emit DidWithdraw(payee, payment);
    }
}
