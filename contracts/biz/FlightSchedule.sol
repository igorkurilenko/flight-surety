// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "./FlightStatusService.sol";

abstract contract FlightSchedule is Pausable, FlightStatusService {
    struct Flight {
        bool isRegistered;
        address airline;
        string flight;
        uint256 timestamp;
        uint8 status;
    }

    event DidRegisterFlight(address airline, string flight, uint256 timestamp);

    mapping(bytes32 => Flight) private flightsById;

    modifier onlyRegisteredAirline(address airline) {
        require(
            _isAirlineRegistered(airline),
            "Only registered airline allowed"
        );
        _;
    }

    function registerFlight(string memory flight, uint256 timestamp)
        external
        whenNotPaused
        onlyRegisteredAirline(msg.sender)
    {
        bytes32 flightId = _getFlightId(msg.sender, flight, timestamp);

        flightsById[flightId] = Flight({
            isRegistered: true,
            airline: msg.sender,
            flight: flight,
            timestamp: timestamp,
            status: STATUS_CODE_UNKNOWN
        });

        emit DidRegisterFlight(msg.sender, flight, timestamp);
    }

    function _isAirlineRegistered(address airline)
        internal
        virtual
        returns (bool);

    function _getFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal view override returns (uint8) {
        bytes32 flightId = _getFlightId(airline, flight, timestamp);

        return flightsById[flightId].status;
    }

    function isFlightRegistered(
        address airline,
        string memory flight,
        uint256 timestamp
    ) public view whenNotPaused returns (bool) {
        bytes32 flightId = _getFlightId(airline, flight, timestamp);

        return flightsById[flightId].isRegistered;
    }

    function _updateFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 status
    )
        internal
        override
    {
        bytes32 flightId = _getFlightId(airline, flight, timestamp);

        _updateFlightStatus(flightId, status);
    }

    function _updateFlightStatus(bytes32 flightId, uint8 status) private {
        require(
            flightsById[flightId].status == STATUS_CODE_UNKNOWN,
            "Flight status has already been processed"
        );

        Flight storage flight = flightsById[flightId];
        flight.status = status;

        if (status == STATUS_CODE_ON_TIME) {
            _onFlightOnTime(flight.airline, flight.flight, flight.timestamp);
            return;
        }

        if (status == STATUS_CODE_LATE_AIRLINE) {
            _onFlightLateAirline(
                flight.airline,
                flight.flight,
                flight.timestamp
            );
            return;
        }

        if (status == STATUS_CODE_LATE_WEATHER) {
            _onFlightLateWeather(
                flight.airline,
                flight.flight,
                flight.timestamp
            );
            return;
        }

        if (status == STATUS_CODE_LATE_TECHNICAL) {
            _onFlightLateTechnical(
                flight.airline,
                flight.flight,
                flight.timestamp
            );
            return;
        }

        if (status == STATUS_CODE_LATE_OTHER) {
            _onFlightLateOther(flight.airline, flight.flight, flight.timestamp);
            return;
        }
    }

    function _onFlightLateAirline(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal virtual;

    function _onFlightOnTime(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal virtual;

    function _onFlightLateWeather(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal virtual;

    function _onFlightLateTechnical(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal virtual;

    function _onFlightLateOther(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal virtual;

    function _getFlightId(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal view virtual returns (bytes32);
}
