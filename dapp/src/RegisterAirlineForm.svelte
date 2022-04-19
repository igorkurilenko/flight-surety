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
    import { registerAirline } from "./FlightSuretyWeb3.svelte";

    let loading = false;

    const airline = {
        name: "",
        address: "",
    };

    async function handleSubmit(event) {
        event.preventDefault();

        loading = true;
        try {
            await registerAirline(airline);

            airline.name = "";
            airline.address = "";
        } catch (e) {
            console.error("Failed to register new airline.\n" + e);
        }
        loading = false;
    }
</script>

<Card body dark color="dark" inverse class="mb-5" style="--bs-bg-opacity: .7;">
    <CardSubtitle class="mb-3">New Airline</CardSubtitle>
    <Form spellcheck="false" on:submit={handleSubmit}>
        <FormGroup floating label="Address" class="text-secondary">
            <Input
                placeholder="Enter a value"
                class="bg-light"
                style="--bs-bg-opacity: .7;"
                required
                title="Please fill in airline account address here."
                oninvalid="this.setCustomValidity('Please fill in airline account address here.')"
                oninput="this.setCustomValidity('')"
                bind:value={airline.address}
            />
        </FormGroup>
        <FormGroup floating label="Name" class="text-secondary">
            <Input
                placeholder="Enter a value"
                class="bg-light"
                style="--bs-bg-opacity: .7;"
                required
                title="Please fill in airline name here."
                oninvalid="this.setCustomValidity('Please fill in airline name here.')"
                oninput="this.setCustomValidity('')"
                bind:value={airline.name}
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
