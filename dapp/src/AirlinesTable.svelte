<script>
    import { Card, CardSubtitle, CardText, Table } from "sveltestrap";
    import AirlineTableRow from "./AirlinesTableRow.svelte";

    export let airlines;
    export let user;
</script>

<Card
    body
    dark
    color="dark"
    inverse
    class="mb-3 mt-5"
    style="--bs-bg-opacity: .7;"
>
    <CardSubtitle class="mb-3">Airlines</CardSubtitle>
    {#if !!airlines && airlines.length > 0}
        <Table class="text-light border-secondary">
            <tbody>
                {#each airlines as airline}
                    <AirlineTableRow bind:user bind:airline />
                {/each}
            </tbody>
        </Table>
    {:else}
        <CardText class="text-center">No Data</CardText>
    {/if}
</Card>
