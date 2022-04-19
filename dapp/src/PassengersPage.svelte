<script>
    import { Container, Col, Row } from "sveltestrap";
    import InsurancePurchaseForm from "./InsurancePurchaseForm.svelte";
    import InsurancePayoutForm from "./InsurancePayoutForm.svelte";
    import FlightStatusForm from "./FlightStatusForm.svelte";
    import { MockAirlines, MockFlights } from "./Const.svelte";
    import { isFlightRegistered } from "./FlightSuretyWeb3.svelte";
    import { getAirlineName } from "./Utils.svelte";

    export let user;

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
</script>

<Container fluid>
    <Row class="d-flex justify-content-center">
        <Col md="8">
            <InsurancePayoutForm bind:user />
            <InsurancePurchaseForm bind:flights />
            <FlightStatusForm bind:flights />
        </Col>
    </Row>
</Container>
