<script>
    import {
        Collapse,
        Navbar,
        NavbarToggler,
        NavbarBrand,
        Nav,
        NavItem,
        NavLink,
        Icon,
    } from "sveltestrap";
    import { UserRole } from "./Const.svelte";
    import { formatUserAddress, formatUserBalance } from "./Utils.svelte";

    export let page = "passengers";
    export let user;

    let isOpen = false;

    $: balanceView = formatUserBalance(user);
    $: addressView = formatUserAddress(user, true);
    $: showMenu =
        !!user &&
        (user.role === UserRole.airline ||
            user.role == UserRole.unregisteredAirline);

    const nav = (to) => () => (page = to);

    function handleCollapseUpdate(event) {
        isOpen = event.detail.isOpen;
    }
</script>

<Navbar color="dark" dark class="mb-5 fixed-top" expand="md">
    <NavbarBrand class="h1 mb-0">FlightSurety</NavbarBrand>
    {#if window.ethereum}
        <NavbarToggler on:click={() => (isOpen = !isOpen)} />
        <Collapse {isOpen} navbar expand="md" on:update={handleCollapseUpdate}>
            <Nav class="ms-auto" navbar>
                {#if showMenu}
                    <NavItem>
                        <NavLink on:click={nav("passengers")}>
                            Passengers
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink on:click={nav("airlines")}>Airlines</NavLink>
                    </NavItem>
                {/if}
                <NavItem>
                    <NavLink disabled>
                        <small>
                            <Icon name="person" />
                            {addressView}
                        </small>
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink disabled>
                        <small><Icon name="wallet" /> {balanceView}</small>
                    </NavLink>
                </NavItem>
            </Nav>
        </Collapse>
    {/if}
</Navbar>
