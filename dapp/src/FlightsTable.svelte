<script>
    import { Card, CardSubtitle, CardText, Table } from "sveltestrap";
    import FlightsTableRow from "./FlightsTableRow.svelte";

    export let flights;
</script>

<Card body dark color="dark" inverse class="mb-3" style="--bs-bg-opacity: .7;">
    <CardSubtitle class="mb-3">Flights</CardSubtitle>
    {#if !!flights && flights.length > 0}
        <Table class="text-light border-secondary">
            <tbody>
                {#each flights as flight}
                    <FlightsTableRow bind:flight />
                {/each}
            </tbody>
        </Table>
    {:else}
        <CardText class="text-center">No Data</CardText>
    {/if}
</Card>
