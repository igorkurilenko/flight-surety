<script>
    import { Container, Col, Row } from "sveltestrap";
    import RegisterAirlineForm from "./RegisterAirlineForm.svelte";
    import AirlinesTable from "./AirlinesTable.svelte";
    import RegisterFlightForm from "./RegisterFlightForm.svelte";
    import FlightsTable from "./FlightsTable.svelte";
    import moment from "moment";
    import {
        getAirlineRegistrationStatus,
        isFlightRegistered,
        onDidRegisterFlight,
        onDidUpdateAirlineRegistrationStatus,
    } from "./FlightSuretyWeb3.svelte";
    import {
        AirlineRegStatus,
        UserRole,
        MockAirlines,
        MockFlights,
    } from "./Const.svelte";
    import {
        equalAddresses,
        getAirlineName,
        formatDate,
        formatAddress,
    } from "./Utils.svelte";
    import { onMount, onDestroy } from "svelte";

    export let user;
    const subscriptions = [];

    console.log("Mock Airlines:");
    MockAirlines.forEach((a) =>
        console.log(`${formatAddress(a.address)}|${a.name}`)
    );

    console.log("Mock Flights:");
    MockFlights.forEach((f) => {
        const name = f.name;
        const date = formatDate(f.timestamp, "L, h:mm a");
        const address = formatAddress(f.airlineAddress);
        console.log(`${name}|${date}|${address}`);
    });

    let mockAirlines = MockAirlines.map((airline) => {
        return Object.assign({ regStatus: AirlineRegStatus.unknown }, airline);
    });

    mockAirlines.forEach(async (airline) => {
        const regStatus = await getAirlineRegistrationStatus(airline.address);
        airline.regStatus = parseInt(regStatus);
        mockAirlines = mockAirlines;
    });

    $: airlines = mockAirlines.filter(
        (airline) => airline.regStatus !== AirlineRegStatus.unknown
    );

    let mockFlights = MockFlights.map((flight) => {
        return Object.assign(
            {
                isRegistered: false,
                airlineName: getAirlineName(
                    MockAirlines,
                    flight.airlineAddress
                ),
            },
            flight
        );
    });

    mockFlights.forEach(async (flight) => {
        const isRegistered = await isFlightRegistered(flight);
        flight.isRegistered = isRegistered;
        mockFlights = mockFlights;
    });

    $: flights = mockFlights.filter((flight) => flight.isRegistered);

    onMount(() => {
        subscriptions.push(
            onDidRegisterFlight((event) => {
                const flight = mockFlights.find((el) => {
                    return (
                        equalAddresses(el.airlineAddress, event.airline) &&
                        el.name === event.flight &&
                        el.timestamp === parseInt(event.timestamp)
                    );
                });

                if (!flight) return;

                flight.isRegistered = true;

                mockFlights = mockFlights;
            })
        );

        subscriptions.push(
            onDidUpdateAirlineRegistrationStatus((event) => {
                const airline = mockAirlines.find((el) => {
                    return equalAddresses(el.address, event.airline);
                });

                if (!airline) return;

                airline.regStatus = parseInt(event.status);

                mockAirlines = mockAirlines;
            })
        );
    });

    onDestroy(() => {
        subscriptions.forEach((s) => s.unsubscribe());
    });
</script>

<Container fluid>
    <Row class="d-flex justify-content-center">
        <Col md="8">
            <AirlinesTable bind:airlines bind:user />
            {#if user.role === UserRole.airline}
                <RegisterAirlineForm />
            {/if}
        </Col>
    </Row>
    <Row class="d-flex justify-content-center">
        <Col md="8">
            <FlightsTable bind:flights />
            {#if user.role === UserRole.airline}
                <RegisterFlightForm />
            {/if}
        </Col>
    </Row>
</Container>
