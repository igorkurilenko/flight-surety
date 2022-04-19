<script>
    import { formatFlightDate } from "./Utils.svelte";

    export let flight;
    $: flightDateView = formatFlightDate(flight);
</script>

<tr>
    <td>{flight.name}</td>
    <td>{flightDateView}</td>
    <td>{flight.airlineName}</td>
</tr>
