<script>
    import {
        Card,
        CardSubtitle,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Form,
        FormGroup,
        Input,
        Button,
        Spinner,
    } from "sveltestrap";
    import {
        fetchFlightStatus,
        onFlightStatusInfo,
    } from "./FlightSuretyWeb3.svelte";
    import { FlightStatus } from "./Const.svelte";
    import { equalAddresses, formatFlightDate } from "./Utils.svelte";
    import { onMount, onDestroy } from "svelte";

    export let flights;

    let selectedFlight;
    let loading = false;
    let modalOpen = false;
    let modalModel;
    const pendingFlights = [];
    const subscriptions = [];

    const toggleModal = () => (modalOpen = !modalOpen);

    onMount(() => {
        subscriptions.push(onFlightStatusInfo(handleFlightStatusInfo));
    });

    onDestroy(() => {
        subscriptions.forEach((s) => s.unsubscribe());
    });

    async function handleSubmit(event) {
        event.preventDefault();

        loading = true;
        try {
            pendingFlights.push(selectedFlight);
            await fetchFlightStatus(selectedFlight);
        } catch (e) {
            pendingFlights.pop();
            console.error(`Failed to fetch flight status.\n${e}`);
        }
        loading = false;
    }

    function handleFlightStatusInfo(event) {
        if (pendingFlights.length === 0) return;

        const info = {
            flightName: event.flight,
            airlineAddress: event.airline,
            flightTimestamp: parseInt(event.timestamp),
            status: parseInt(event.status),
        };

        const index = pendingFlights.findIndex((flight) => {
            return (
                equalAddresses(flight.airlineAddress, info.airlineAddress) &&
                flight.name === info.flightName &&
                flight.timestamp === info.flightTimestamp
            );
        });

        if (index >= 0) {
            modalModel = {
                flight: pendingFlights[index],
                status: info.status,
            };
            pendingFlights.splice(index, 1);
            toggleModal();
        }
    }
</script>

<Card body dark color="dark mb-5" inverse style="--bs-bg-opacity: .5;">
    <CardSubtitle class="mb-3">Flight Status (Simulation)</CardSubtitle>
    {#if !!flights && flights.length > 0}
        <Form spellcheck="false" on:submit={handleSubmit}>
            <FormGroup floating label="Select a Flight" class="text-secondary">
                <Input
                    type="select"
                    class="bg-light"
                    placeholder="Select a flight"
                    style="--bs-bg-opacity: .7"
                    required
                    title="Please select a flight."
                    oninvalid="this.setCustomValidity('Please select a flight.')"
                    oninput="this.setCustomValidity('')"
                    bind:value={selectedFlight}
                >
                    <option selected value>--</option>
                    {#each flights as f}
                        <option value={f}>
                            {f.name} - {formatFlightDate(f)} - {f.airlineName}
                        </option>
                    {/each}
                </Input>
            </FormGroup>
            <Button
                size="lg"
                color="primary"
                block
                type="submit"
                disabled={loading}
            >
                {#if loading}
                    <Spinner size="sm" />
                {/if}
                Check Fligth Status
            </Button>
        </Form>
        <Modal isOpen={modalOpen} {toggleModal}>
            <ModalHeader {toggleModal}>Flight Status</ModalHeader>
            <ModalBody>
                <p>
                    <small
                        ><strong>
                            {modalModel.flight.name}, {formatFlightDate(
                                modalModel.flight
                            )}, {modalModel.flight.airlineName}
                        </strong>
                    </small>
                </p>
                {#if modalModel.status === FlightStatus.unknown}
                    <h3>Unknown</h3>
                    <p>Flight status is unknown. Please try again later.</p>
                {:else if modalModel.status === FlightStatus.onTime}
                    <h3>On Time</h3>
                {:else if modalModel.status === FlightStatus.lateAirline}
                    <h3>Late</h3>
                    <p>
                        The flight delay did happen due airline company. Check
                        your credit.
                    </p>
                {:else if modalModel.status === FlightStatus.lateWeather}
                    <h3>Late</h3>
                    <p>
                        The flight delay did happen due weather. No insurance
                        case did happen.
                    </p>
                {:else if modalModel.status === FlightStatus.lateTechnical}
                    <h3>Late</h3>
                    <p>
                        The flight delay did happen due technical reason. No
                        insurance case did happen.
                    </p>
                {:else if modalModel.status === FlightStatus.lateOther}
                    <h3>Late</h3>
                    <p>
                        The delay occurred for a reason that is not covered by
                        insurance.
                    </p>
                {/if}
            </ModalBody>
            <ModalFooter>
                <Button size="lg" outline color="dark" on:click={toggleModal}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    {:else}
        There are no flights registered at the moment.
    {/if}
</Card>
