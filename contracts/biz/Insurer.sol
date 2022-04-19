// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

abstract contract Insurer is Pausable, ReentrancyGuard {
    using SafeMath for uint256;

    event DidBuyInsur(address insuree, bytes32 caseId, uint256 sumInsured);
    event DidPay(address insuree, uint256 amount);

    uint256 public constant MAX_INSUR_PREMIUM = 1 ether;
    uint8 private constant AIRLINE_LATE_INSUR_CASE_TARIFF_PCT = 150;

    uint256 private liabilityLimit;
    mapping(bytes32 => uint256) liabilityLimitByCaseId;

    modifier onlyNonContract() {
        require(msg.sender == tx.origin, "Contract callers are restricted");
        _;
    }

    function buyFlightInsur(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external payable whenNotPaused onlyNonContract returns (bytes32 insurId) {
        require(
            _isFlightRegistered(airline, flight, timestamp),
            "Unknown flight"
        );
        require(msg.value != 0, "Value required");
        require(
            msg.value <= MAX_INSUR_PREMIUM,
            "Payment amount exceeds the max allowed insurance premium"
        );

        bytes32 caseId = _getFlightId(airline, flight, timestamp);
        uint256 sumInsured = computeAirlineLateInsurCaseSumInsured(msg.value);

        return buyInsur(caseId, sumInsured);
    }

    function buyInsur(bytes32 caseId, uint256 sumInsured)
        private
        returns (bytes32 insurId)
    {
        (bool ok, uint256 sum) = liabilityLimit.tryAdd(sumInsured);

        require(ok, "Max liability limit exceeded");
        require(
            sum <= _getInsurFundAmount(),
            "Insuficcient fund to sell the insurance"
        );

        insurId = _buyInsur(caseId, msg.sender, sumInsured, msg.value);

        liabilityLimit = liabilityLimit.add(sumInsured);
        liabilityLimitByCaseId[caseId] = liabilityLimitByCaseId[caseId].add(
            sumInsured
        );

        emit DidBuyInsur(msg.sender, caseId, sumInsured);
    }

    function _buyInsur(
        bytes32 caseId,
        address insuree,
        uint256 sumInsured,
        uint256 value
    ) internal virtual returns (bytes32 insurId);

    function _isFlightRegistered(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal virtual returns (bool);

    function _getInsurFundAmount() internal virtual returns (uint256);

    function computeAirlineLateInsurCaseSumInsured(uint256 price)
        private
        pure
        returns (uint256)
    {
        return price.mul(AIRLINE_LATE_INSUR_CASE_TARIFF_PCT).div(100);
    }

    function creditInsurees(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal whenNotPaused {
        bytes32 caseId = _getFlightId(airline, flight, timestamp);

        _creditInsurees(caseId);

        delete liabilityLimitByCaseId[caseId];
    }

    function _creditInsurees(bytes32 caseId) internal virtual;

    function releaseInsurs(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal whenNotPaused {
        bytes32 caseId = _getFlightId(airline, flight, timestamp);

        _releaseInsurs(caseId);

        liabilityLimit = liabilityLimit.sub(liabilityLimitByCaseId[caseId]);
        delete liabilityLimitByCaseId[caseId];
    }

    function _releaseInsurs(bytes32 caseId) internal virtual;

    function creditOf(address insuree)
        external
        whenNotPaused
        returns (uint256)
    {
        return _depositsOf(insuree);
    }

    function pay() external whenNotPaused onlyNonContract nonReentrant {
        uint256 deposits = _depositsOf(msg.sender);

        _pay(msg.sender);

        liabilityLimit = liabilityLimit.sub(deposits);

        emit DidPay(msg.sender, deposits);
    }

    function _depositsOf(address insuree) internal virtual returns (uint256);

    function _pay(address insuree) internal virtual;

    function _getFlightId(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal view virtual returns (bytes32);
}
