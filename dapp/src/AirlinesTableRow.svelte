<script>
    import { Button, Icon, Spinner } from "sveltestrap";
    import { AirlineRegStatus, UserRole } from "./Const.svelte";
    import { fund, registerAirline } from "./FlightSuretyWeb3.svelte";
    import { equalAddresses } from "./Utils.svelte";

    export let user;
    export let airline;

    let loading = false;

    $: canFund = (airline) => {
        return (
            equalAddresses(airline.address, user.address) &&
            airline.regStatus === AirlineRegStatus.approved
        );
    };

    $: canVote = (airline) => {
        return (
            !equalAddresses(airline.address, user.address) &&
            airline.regStatus === AirlineRegStatus.voting &&
            user.role === UserRole.airline
        );
    };

    $: handleFund = async (airline) => {
        loading = true;
        try {
            await fund(airline);
        } catch (e) {
            console.error("Failed to provide fund.\n" + e);
        }
        loading = false;
    };

    $: handleVote = async (airline) => {
        loading = true;
        try {
            await registerAirline(airline);
        } catch (e) {
            console.error("Failed to vote.\n" + e);
        }
        loading = false;
    };
</script>

<tr>
    <td>{airline.address}</td>
    <td>{airline.name}</td>
    <td>
        {#if airline.regStatus === AirlineRegStatus.registered}
            <Icon name="patch-check-fill" />
        {:else}
            <Icon name="clock" />
        {/if}
    </td>
    <td>
        {#if canFund(airline)}
            <Button
                size="sm"
                outline
                color="light"
                disabled={loading}
                on:click={handleFund(airline)}
            >
                {#if loading}
                    <Spinner size="sm" />
                {/if}
                Fund
            </Button>
        {/if}
        {#if canVote(airline)}
            <Button
                size="sm"
                outline
                color="light"
                disabled={loading}
                on:click={handleVote(airline)}
            >
                {#if loading}
                    <Spinner size="sm" />
                {/if}
                Vote
            </Button>
        {/if}
    </td>
</tr>
