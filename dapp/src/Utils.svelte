<script context="module">
    import { UserRole, AirlineRegStatus } from "./Const.svelte";
    import moment from "moment";

    export const web3 = new Web3(window.ethereum);

    export const formatUserAddress = (user, shorten) => {
        if (!user) return "0x0";

        return formatAddress(user.address, shorten);
    };

    export const formatAddress = (address, shorten) => {
        if (!address) return "0x0";

        shorten = shorten || false;
        address = address.substr(2).toUpperCase();

        return shorten ? `0x${shortenAddress(address)}`: `0x${address}`;
    };

    function shortenAddress(address) {
        return (
            address.substr(0, 3) +
            "..." +
            address.substr(address.length - 4, address.length)
        );
    }

    export const equalAddresses = (address1, address2) => {
        return formatAddress(address1) === formatAddress(address2);
    };

    export const formatUserBalance = (user) => {
        if (!user) return "0 ETH";

        return parseFloat(toEther(user.balance)).toFixed(4) + " ETH";
    };

    export const toWei = (ether) => {
        return parseInt(web3.utils.toWei(ether + "", "ether"));
    };

    export const toEther = (wei) => {
        return parseFloat(web3.utils.fromWei(wei + "", "ether"));
    };

    export const getAirlineName = (airlines, airlineAddress) => {
        const airline = airlines.find((e) => {
            return equalAddresses(e.address, airlineAddress);
        });
        return airline.name;
    };

    export const getUserRoleByAirlineRegStatus = (airlineRegStatus) => {
        airlineRegStatus = airlineRegStatus || AirlineRegStatus.unknown;
        airlineRegStatus = parseInt(airlineRegStatus);

        if (airlineRegStatus === AirlineRegStatus.registered) {
            return UserRole.airline;
        }

        if (
            airlineRegStatus === AirlineRegStatus.voting ||
            airlineRegStatus === AirlineRegStatus.approved
        ) {
            return UserRole.unregisteredAirline;
        }

        return UserRole.user;
    };

    export const formatFlightDate = (flight) => {
        return formatDate(flight.timestamp);
    };

    export const formatDate = (timestamp, format) => {
        format = format || "lll";
        return moment(timestamp * 1000).format(format);
    };
</script>
