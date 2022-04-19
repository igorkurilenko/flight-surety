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
    import moment from "moment";
    import { registerFlight } from "./FlightSuretyWeb3.svelte";

    let loading = false;

    const flight = {
        name: "",
        timestamp: "",
    };

    async function handleSubmit(event) {
        event.preventDefault();

        loading = true;
        try {
            await registerFlight({
                name: flight.name,
                timestamp: moment(flight.timestamp).unix(),
            });

            flight.name = "";
            flight.timestamp = 0;
        } catch (e) {
            console.error("Failed to register new flight.\n" + e);
        }
        loading = false;
    }
</script>

<Card body dark color="dark" inverse class="mb-5" style="--bs-bg-opacity: .7;">
    <CardSubtitle class="mb-3">New Flight</CardSubtitle>
    <Form spellcheck="false" on:submit={handleSubmit}>
        <FormGroup floating label="Flight Name" class="text-secondary">
            <Input
                placeholder="Enter a value"
                class="bg-light"
                style="--bs-bg-opacity: .7;"
                required
                title="Please fill in flight name here."
                oninvalid="this.setCustomValidity('Please fill in flight name here.')"
                oninput="this.setCustomValidity('')"
                bind:value={flight.name}
            />
        </FormGroup>
        <FormGroup floating label="Departure Date, Time" class="text-secondary">
            <Input
                placeholder="Enter a value"
                class="bg-light"
                style="--bs-bg-opacity: .7;"
                required
                type="datetime-local"
                name="datetime"
                title="Please fill in flight departure date and time here."
                oninvalid="this.setCustomValidity('Please fill in flight departure date and time here.')"
                oninput="this.setCustomValidity('')"
                bind:value={flight.timestamp}
            />
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
            Register
        </Button>
    </Form>
</Card>
