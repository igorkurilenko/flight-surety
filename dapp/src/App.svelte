<script>
	import Navbar from "./Navbar.svelte";
	import EthereumAlert from "./EthereumAlert.svelte";
	import FlightSuretyWeb3 from "./FlightSuretyWeb3.svelte";
	import PassengersPage from "./PassengersPage.svelte";
	import AirlinesPage from "./AirlinesPage.svelte";
	import { UserRole } from "./Const.svelte";

	let user = null;
	let page = "passengers";

	$: if (!user || user.role === UserRole.user) {
		page = "passengers";
	}

	function didUpdateUser(event) {
		user = event.detail;
	}
</script>

<Navbar bind:page bind:user />

{#if window.ethereum}
	<FlightSuretyWeb3 on:didUpdateUser={didUpdateUser} />
	{#if !!user}
		{#if page === "passengers"}
			<PassengersPage bind:user />
		{:else if page === "airlines"}
			<AirlinesPage bind:user />
		{/if}
	{/if}
{:else}
	<EthereumAlert />
{/if}

<style>
	:global(html) {
		height: 100%;
	}
	:global(body) {
		background-image: url("/flight.jpg");
		background-repeat: no-repeat;
		background-size: cover;
		background-position: center top;
		background-color: #111;
		background-attachment: fixed;
		padding-top: 4.5rem;
	}
</style>
