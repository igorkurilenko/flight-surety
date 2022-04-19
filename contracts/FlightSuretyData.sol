// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./access/Authorizable.sol";
import "./access/Killable.sol";
import "./biz/Escrow.sol";

contract FlightSuretyData is
    Ownable,
    Authorizable,
    Pausable,
    ReentrancyGuard,
    Escrow,
    Killable
{
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Insur {
        bytes32 id;
        bytes32 caseId;
        address insuree;
        uint256 sumInsured;
    }

    EnumerableSet.AddressSet private airlines;
    mapping(bytes32 => Insur) private insursById;
    mapping(bytes32 => bytes32[]) private insurIdsByCaseId;

    constructor() {
        airlines.add(msg.sender);
    }

    function pause() external whenNotPaused onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner whenPaused {
        _unpause();
    }

    function renounceOwnership() public override whenNotPaused onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public override whenNotPaused onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function authorizeCaller(address callerAddress)
        external
        whenNotPaused
        onlyOwner
    {
        _authorizeCaller(callerAddress);
    }

    function deauthorizeCaller(address callerAddress)
        external
        whenNotPaused
        onlyOwner
    {
        _deauthorizeCaller(callerAddress);
    }

    function registerAirline(address airline)
        external
        payable
        whenNotPaused
        onlyAuthorized
    {
        require(airline != address(0), "Airline address is the zero address");
        require(!airlines.contains(airline), "Airline is already registered");
        require(msg.value != 0, "Fund of zero Ether is not allowed");

        airlines.add(airline);
    }

    function isAirlineRegistered(address airline)
        external
        view
        whenNotPaused
        onlyAuthorized
        returns (bool)
    {
        return airlines.contains(airline);
    }

    function getRegisteredAirlinesNumber()
        external
        view
        whenNotPaused
        onlyAuthorized
        returns (uint256)
    {
        return airlines.length();
    }

    function buyInsur(
        bytes32 caseId,
        address insuree,
        uint256 sumInsured
    ) external payable whenNotPaused onlyAuthorized returns (bytes32 insurId) {
        require(insuree != address(0), "Invalid insuree address");
        require(msg.value != 0, "Value required");

        insurId = getInsurId(caseId, insuree);

        _buyInsur(insurId, caseId, insuree, sumInsured);
    }

    function _buyInsur(
        bytes32 insurId,
        bytes32 caseId,
        address insuree,
        uint256 sumInsured
    ) private {
        require(
            insursById[insurId].insuree == address(0),
            "Insurance for the case has already been purchased"
        );

        insurIdsByCaseId[caseId].push(insurId);
        insursById[insurId] = Insur(insurId, caseId, insuree, sumInsured);
    }

    function creditInsurees(bytes32 caseId)
        external
        whenNotPaused
        onlyAuthorized
    {
        bytes32[] storage insurIds = insurIdsByCaseId[caseId];

        for (uint256 i = 0; i < insurIds.length; i++) {
            bytes32 insurId = insurIds[i];
            Insur memory insur = insursById[insurId];

            _deposit(insur.insuree, insur.sumInsured);

            delete insursById[insurId];
        }

        delete insurIdsByCaseId[caseId];
    }

    function releaseInsurs(bytes32 caseId)
        external
        whenNotPaused
        onlyAuthorized
    {
        bytes32[] storage insurIds = insurIdsByCaseId[caseId];

        for (uint256 i = 0; i < insurIds.length; i++) {
            bytes32 insurId = insurIds[i];
            delete insursById[insurId];
        }

        delete insurIdsByCaseId[caseId];
    }

    function pay(address insuree)
        external
        whenNotPaused
        onlyAuthorized
        nonReentrant
    {
        require(depositsOf(insuree) > 0, "Insufficient insuree balance");
        require(
            depositsOf(insuree) <= address(this).balance,
            "Insufficient contract balance"
        );

        _withdraw(insuree);
    }

    function getInsurId(bytes32 caseId, address insuree)
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(caseId, insuree));
    }
}
