<script context="module">
    import moment from "moment";

    export const UserRole = {
        user: "user",
        airline: "airline",
        unregisteredAirline: "unregistered_airline",
    };

    export const AirlineRegStatus = {
        unknown: 0,
        voting: 10,
        approved: 20,
        registered: 30,
    };

    export const FlightStatus = {
        unknown: 0,
        onTime: 10,
        lateAirline: 20,
        lateWeather: 30,
        lateTechnical: 40,
        lateOther: 50
    };

    export const MockAirlines = [
        {
            name: "Udacity Airlines",
            address: "0x61f65fa52bF25D09b29c603EdDDb7f226541f588",
        },
        {
            name: "Adria Airways",
            address: "0xB0A90d4aC2DD2C9A7f9D269c8789C7b8278b388D",
        },
        {
            name: "Aer Arann",
            address: "0xb2FCa637Fcc918B3213E023AEBD264992b06Ad06",
        },
        {
            name: "Aer Lingus",
            address: "0x8Db63bD88f9858CF379c8d4419211d3AE9a45eD6",
        },
        {
            name: "Aeroflot",
            address: "0xdE090675845AAb04B2ec0Fa56c8F36dD508BDCdE",
        },
    ];

    export const MockFlights = [
        {
            airlineAddress: "0x61f65fa52bF25D09b29c603EdDDb7f226541f588",
            name: "DP 6521",
            timestamp: moment('2022-04-21T00:10').unix(),
        },
        {
            airlineAddress: "0xdE090675845AAb04B2ec0Fa56c8F36dD508BDCdE",
            name: "SU 6505",
            timestamp: moment('2022-04-21T00:50').unix(),
        },
        {
            airlineAddress: "0xdE090675845AAb04B2ec0Fa56c8F36dD508BDCdE",
            name: "SU 1306",
            timestamp: moment('2022-04-21T01:30').unix(),
        },
        {
            airlineAddress: "0xb2FCa637Fcc918B3213E023AEBD264992b06Ad06",
            name: "SU 1512",
            timestamp: moment('2022-04-21T02:00').unix(),
        },
        {
            airlineAddress: "0xB0A90d4aC2DD2C9A7f9D269c8789C7b8278b388D",
            name: "SU 1138",
            timestamp: moment('2022-04-21T02:20').unix(),
        },
    ];
</script>
