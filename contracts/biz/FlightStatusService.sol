// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/security/Pausable.sol";

abstract contract FlightStatusService is Pausable {
    uint256 public constant ORACLE_REGISTRATION_FEE = 1 ether;
    uint256 private constant MIN_RESPONSES = 3;

    // Flight status codees
    uint8 internal constant STATUS_CODE_UNKNOWN = 0;
    uint8 internal constant STATUS_CODE_ON_TIME = 10;
    uint8 internal constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 internal constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 internal constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 internal constant STATUS_CODE_LATE_OTHER = 50;

    uint8 private nonce = 0;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    struct ResponseInfo {
        address requester;
        bool isOpen;
        mapping(uint8 => address[]) responses;
    }

    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    event DidGetOracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event DidRegisterOracle(
        address oracle
    );

    mapping(address => Oracle) private oracles;
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    modifier onlyRegisteredAsOracle() {
        require(
            oracles[msg.sender].isRegistered == true,
            "Not registered as an oracle"
        );
        _;
    }
    modifier onlyNotRegisteredAsOracle() {
        require(
            oracles[msg.sender].isRegistered == false,
            "Oracle has already been registered"
        );
        _;
    }
    modifier onlyRegisteredFlight(
        address airline,
        string memory flight,
        uint256 timestamp
    ) {
        require(
            _isFlightRegistered(airline, flight, timestamp),
            "Flight must be registered"
        );
        _;
    }

    function fetchFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external whenNotPaused onlyRegisteredFlight(airline, flight, timestamp) {
        uint8 status = _getFlightStatus(airline, flight, timestamp);

        if (status != STATUS_CODE_UNKNOWN) {
            emit FlightStatusInfo(airline, flight, timestamp, status);
            return;
        }

        uint8 index = getRandomIndex(msg.sender);
        bytes32 responseId = keccak256(
            abi.encodePacked(index, flight, timestamp, airline)
        );

        ResponseInfo storage respInfo = oracleResponses[responseId];
        respInfo.requester = msg.sender;
        respInfo.isOpen = true;

        emit OracleRequest(index, airline, flight, timestamp);
    }

    function _isFlightRegistered(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal virtual returns (bool);

    function _getFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal virtual returns (uint8);

    function registerOracle()
        external
        payable
        whenNotPaused
        onlyNotRegisteredAsOracle
    {
        require(
            msg.value >= ORACLE_REGISTRATION_FEE,
            "Insufficient fee for oracle registration"
        );

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});

        emit DidRegisterOracle(msg.sender);

        if (msg.value > ORACLE_REGISTRATION_FEE) {
            payable(msg.sender).transfer(msg.value - ORACLE_REGISTRATION_FEE);
        }
    }

    function getOracleIndexes()
        external
        view
        whenNotPaused
        onlyRegisteredAsOracle
        returns (uint8[3] memory)
    {
        return oracles[msg.sender].indexes;
    }

    function isRegisteredAsOracle(address oracle) external view whenNotPaused returns (bool) {
        return oracles[oracle].isRegistered;
    }

    function submitOracleResponse(
        uint8 index,
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 status
    )
        external
        whenNotPaused
        onlyRegisteredAsOracle
        onlyRegisteredFlight(airline, flight, timestamp)
    {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle"
        );

        bytes32 responseId = keccak256(
            abi.encodePacked(index, flight, timestamp, airline)
        );

        if (!oracleResponses[responseId].isOpen) {
            return;
        }

        oracleResponses[responseId].responses[status].push(msg.sender);

        emit DidGetOracleReport(airline, flight, timestamp, status);

        if (
            oracleResponses[responseId].responses[status].length >=
            MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, status);

            _updateFlightStatus(airline, flight, timestamp, status);

            delete oracleResponses[responseId];
        }
    }

    function _updateFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 status
    ) internal virtual;

    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.difficulty,
                        account,
                        nonce++
                    )
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0;
        }

        return random;
    }
}
