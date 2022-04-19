<script>
    import {
        Card,
        CardSubtitle,
        Form,
        FormGroup,
        Input,
        Button,
        Spinner,
    } from "sveltestrap";
    import {
        getMaxInsurPremium,
        buyFlightInsur,
    } from "./FlightSuretyWeb3.svelte";
    import { toWei, toEther, formatFlightDate } from "./Utils.svelte";

    export let flights;

    let selectedFlight;
    let insuredAmountEth;
    let loading = false;
    let maxInsuredAmountEth = 1;
    const minInsuredAmountEth = 0.001;

    getMaxInsurPremium().then((wei) => {
        maxInsuredAmountEth = toEther(wei);
    });

    async function handleSubmit(event) {
        event.preventDefault();

        const insuredAmountWei = toWei(insuredAmountEth);

        loading = true;
        try {
            await buyFlightInsur(selectedFlight, insuredAmountWei);
            insuredAmountEth = undefined;
        } catch (e) {
            console.error(`Failed to buy flight insurance.\n${e}`);
        }
        loading = false;
    }
</script>

<Card body dark color="dark mb-5" inverse style="--bs-bg-opacity: .5;">
    <CardSubtitle class="mb-3">Insurance Purchase</CardSubtitle>
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
                    {#each flights as flight}
                        <option value={flight}>
                            {flight.name} - {formatFlightDate(flight)} - {flight.airlineName}
                        </option>
                    {/each}
                </Input>
            </FormGroup>
            <FormGroup
                floating
                label="Insured Amount (Min: {minInsuredAmountEth} ETH; Max: {maxInsuredAmountEth} ETH)"
                class="text-secondary"
            >
                <Input
                    type="number"
                    min={minInsuredAmountEth}
                    max={maxInsuredAmountEth}
                    step={minInsuredAmountEth}
                    placeholder="0"
                    class="bg-light"
                    style="--bs-bg-opacity: .7;"
                    required
                    title="Please fill in the value."
                    oninvalid="this.setCustomValidity('Value must be less then or equal to {maxInsuredAmountEth} but greather then or equal to {minInsuredAmountEth}.')"
                    oninput="this.setCustomValidity('')"
                    bind:value={insuredAmountEth}
                />
            </FormGroup>
            <Button
                size="lg"
                color="success"
                block
                type="submit"
                disabled={loading}
            >
                {#if loading}
                    <Spinner size="sm" />
                {/if}
                Buy Insurance
            </Button>
        </Form>
    {:else}
        There are no flights registered at the moment to buy insurance.
    {/if}
</Card>
