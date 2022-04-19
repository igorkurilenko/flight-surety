// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

abstract contract AirlineRegistrar is Pausable {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint8 public constant REGISTRATION_STATUS_UNKNOWN = 0;
    uint8 public constant REGISTRATION_STATUS_VOTING = 10;
    uint8 public constant REGISTRATION_STATUS_APPROVED = 20;
    uint8 public constant REGISTRATION_STATUS_OK = 30;

    uint256 public constant AIRLINE_REGISTRATION_FEE = 10 ether;

    uint8 private constant MIN_VOTERS_TO_REGISTER_BY_CONSENSUS = 4;
    uint8 private constant MIN_CONSENSUS_VALUE_PCT = 50;

    EnumerableSet.AddressSet private airlinesRegistrationQueue;
    mapping(address => EnumerableSet.AddressSet) private votersByAirline;
    mapping(address => uint8) private regStatusByAirline;

    event DidVoteForAirlineRegistration(address voter, address airline);
    event DidUpdateAirlineRegistrationStatus(address airline, uint8 status);

    constructor() {
        _setRegStatus(msg.sender, REGISTRATION_STATUS_OK);
    }

    function registerAirline(address airline)
        external
        whenNotPaused
        returns (bool success, uint256 votes)
    {
        require(airline != address(0), "Invalid airline address");
        require(
            _isAirlineRegistered(msg.sender) == true,
            "Caller is not a registered airline"
        );
        require(
            !_isAirlineRegistered(airline),
            "Airline is already registered"
        );
        require(
            !votersByAirline[airline].contains(msg.sender),
            "Already voted"
        );

        return _getAirlineRegistrationStrategy()(airline);
    }

    function getAirlineRegistrationStatus(address airline)
        external
        view
        whenNotPaused
        returns (uint8)
    {
        return regStatusByAirline[airline];
    }

    function _isAirlineRegistered(address airline)
        internal
        virtual
        returns (bool);

    function _getAirlineRegistrationStrategy()
        private
        view
        returns (function(address) internal returns (bool, uint256))
    {
        return
            _getVotersNumber() >= MIN_VOTERS_TO_REGISTER_BY_CONSENSUS
                ? _registerByConsensus
                : _registerByDefault;
    }

    function _registerByDefault(address airline)
        private
        returns (bool success, uint256 votes)
    {
        airlinesRegistrationQueue.add(airline);

        _setRegStatus(airline, REGISTRATION_STATUS_APPROVED);

        return (true, 1);
    }

    function _setRegStatus(address airline, uint8 status) private {
        uint8 oldStatus = regStatusByAirline[airline];
        regStatusByAirline[airline] = status;

        if (oldStatus != status) {
            emit DidUpdateAirlineRegistrationStatus(airline, status);
        }
    }

    function _registerByConsensus(address airline)
        private
        returns (bool success, uint256 votes)
    {
        uint256 votesNumber = _vote(airline);
        uint256 votersNumber = _getVotersNumber();

        if (votesNumber.mul(100) >= votersNumber.mul(MIN_CONSENSUS_VALUE_PCT)) {
            delete votersByAirline[airline];
            airlinesRegistrationQueue.add(airline);

            _setRegStatus(airline, REGISTRATION_STATUS_APPROVED);

            return (true, votesNumber);
        }

        _setRegStatus(airline, REGISTRATION_STATUS_VOTING);

        return (false, votesNumber);
    }

    function _getRegisteredAirlinesNumber()
        internal
        view
        virtual
        returns (uint256);

    function _getApprovedAirlinesNumber() internal view returns (uint256) {
        return airlinesRegistrationQueue.length();
    }

    function _getVotersNumber() internal view returns (uint256) {
        return _getRegisteredAirlinesNumber() + _getApprovedAirlinesNumber();
    }

    function _vote(address airline) private returns (uint256 votesNumber) {
        EnumerableSet.AddressSet storage voters = votersByAirline[airline];
        voters.add(msg.sender);

        emit DidVoteForAirlineRegistration(msg.sender, airline);

        votesNumber = voters.length();
    }

    function fund() public payable whenNotPaused {
        require(
            airlinesRegistrationQueue.contains(msg.sender),
            "Airline isn't in the registration queue"
        );
        require(
            msg.value >= AIRLINE_REGISTRATION_FEE,
            "Insufficient fee for airline registration"
        );

        airlinesRegistrationQueue.remove(msg.sender);

        _registerAirline(msg.sender, AIRLINE_REGISTRATION_FEE);
        _setRegStatus(msg.sender, REGISTRATION_STATUS_OK);

        if (msg.value > AIRLINE_REGISTRATION_FEE) {
            payable(msg.sender).transfer(msg.value - AIRLINE_REGISTRATION_FEE);
        }
    }

    function _registerAirline(address airline, uint256 fund) internal virtual;

    receive() external payable {
        fund();
    }
}
