// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./access/Killable.sol";
import "./biz/Insurer.sol";
import "./biz/AirlineRegistrar.sol";
import "./biz/FlightSchedule.sol";

contract FlightSuretyApp is
    Ownable,
    Pausable,
    ReentrancyGuard,
    Insurer,
    AirlineRegistrar,
    FlightSchedule,
    Killable
{
    using SafeMath for uint256;

    IFlightSuretyData private dataContract;

    constructor(address dataContractAddress) {
        dataContract = IFlightSuretyData(dataContractAddress);
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

    function _registerAirline(address airline, uint256 fund) internal override {
        dataContract.registerAirline{value: fund}(airline);
    }

    function _getRegisteredAirlinesNumber()
        internal
        view
        override
        returns (uint256)
    {
        return dataContract.getRegisteredAirlinesNumber();
    }

    function _isAirlineRegistered(address airline)
        internal
        view
        override(AirlineRegistrar, FlightSchedule)
        returns (bool)
    {
        return dataContract.isAirlineRegistered(airline);
    }

    function _isFlightRegistered(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal view override(Insurer, FlightStatusService) returns (bool) {
        return isFlightRegistered(airline, flight, timestamp);
    }

    function _buyInsur(
        bytes32 caseId,
        address insuree,
        uint256 sumInsured,
        uint256 value
    ) internal override returns (bytes32 insurId) {
        return dataContract.buyInsur{value: value}(caseId, insuree, sumInsured);
    }

    function _getInsurFundAmount() internal view override returns (uint256) {
        return address(dataContract).balance;
    }

    function _creditInsurees(bytes32 caseId) internal override {
        dataContract.creditInsurees(caseId);
    }

    function _releaseInsurs(bytes32 caseId) internal override {
        dataContract.releaseInsurs(caseId);
    }

    function _depositsOf(address insuree)
        internal
        view
        override
        returns (uint256)
    {
        return dataContract.depositsOf(insuree);
    }

    function _pay(address insuree) internal override {
        dataContract.pay(insuree);
    }

    function _onFlightLateAirline(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal override {
        creditInsurees(airline, flight, timestamp);
    }

    function _onFlightOnTime(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal override {
        releaseInsurs(airline, flight, timestamp);
    }

    function _onFlightLateWeather(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal override {
        releaseInsurs(airline, flight, timestamp);
    }

    function _onFlightLateTechnical(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal override {
        releaseInsurs(airline, flight, timestamp);
    }

    function _onFlightLateOther(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal override {
        releaseInsurs(airline, flight, timestamp);
    }

    function _getFlightId(
        address airline,
        string memory flight,
        uint256 timestamp
    )
        internal
        view
        override(Insurer, FlightSchedule)
        whenNotPaused
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(flight, timestamp, airline));
    }
}

interface IFlightSuretyData {
    function registerAirline(address airlineAddress) external payable;

    function isAirlineRegistered(address airlineAddress)
        external
        view
        returns (bool);

    function getRegisteredAirlinesNumber() external view returns (uint256);

    function buyInsur(
        bytes32 caseId,
        address insuree,
        uint256 sumInsured
    ) external payable returns (bytes32 insurId);

    function creditInsurees(bytes32 caseId) external;

    function releaseInsurs(bytes32 caseId) external;

    function pay(address insuree) external;

    function depositsOf(address insuree) external view returns (uint256);
}
