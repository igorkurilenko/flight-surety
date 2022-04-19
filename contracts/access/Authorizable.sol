// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract Authorizable is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private _authorizedCallers;

    modifier onlyAuthorized() {
        require(
            _authorizedCallers.contains(_msgSender()) || owner() == _msgSender(),
            "Caller is not authorized"
        );
        _;
    }

    function _authorizeCaller(address caller) internal virtual {
        require(
            caller != address(0),
            "Authorizable: new authorized caller is the zero address"
        );

        _authorizedCallers.add(caller);
    }

    function _deauthorizeCaller(address caller) internal virtual {
        _authorizedCallers.remove(caller);
    }
}
