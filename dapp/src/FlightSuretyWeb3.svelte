<script context="module">
    import FlightSuretyAppContract from "./contracts/FlightSuretyApp.json";
    import {
        web3,
        getUserRoleByAirlineRegStatus,
        equalAddresses,
    } from "./Utils.svelte";
    import { AirlineRegStatus } from "./Const.svelte";

    let user;
    let appContract;
    const initPromise = init();

    async function init() {
        if (!!appContract) return;

        const networkId = await web3.eth.net.getId();
        const appContractDeployedNetwork =
            FlightSuretyAppContract.networks[networkId];

        if (!appContractDeployedNetwork) {
            throw "Select correct deployed network and reload page";
        }

        appContract = new web3.eth.Contract(
            FlightSuretyAppContract.abi,
            appContractDeployedNetwork && appContractDeployedNetwork.address
        );

        user = await getCurrentUser();
    }

    export async function getCurrentUser() {
        const address = await getCurrentAccount();

        if (!address) return null;

        const balance = await getBalance(address);
        const airlineRegStatus = await getAirlineRegistrationStatus(address);
        const role = getUserRoleByAirlineRegStatus(airlineRegStatus);

        return {
            address: address,
            balance: balance,
            role: role,
        };
    }

    export async function getCurrentAccount() {
        let accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
        });

        return accounts.length > 0 ? accounts[0] : null;
    }

    export async function getBalance(account) {
        return !!account ? await web3.eth.getBalance(account) : 0;
    }

    export async function getAirlineRegistrationStatus(address) {
        if (!address) return AirlineRegStatus.unknown;

        return await appContract.methods
            .getAirlineRegistrationStatus(address)
            .call();
    }

    export async function registerAirline(airline) {
        const account = await getCurrentAccount();

        await appContract.methods
            .registerAirline(airline.address)
            .send({ from: account });
    }

    export async function fund() {
        const account = await getCurrentAccount();
        const fee = await getAirlineRegistrationFee();

        await appContract.methods.fund().send({ from: account, value: fee });
    }

    export async function registerFlight(flight) {
        const account = await getCurrentAccount();

        await appContract.methods
            .registerFlight(flight.name, flight.timestamp)
            .send({ from: account });
    }

    export async function isFlightRegistered(flight) {
        return await appContract.methods
            .isFlightRegistered(
                flight.airlineAddress,
                flight.name,
                flight.timestamp
            )
            .call();
    }

    export async function fetchFlightStatus(flight) {
        const account = await getCurrentAccount();
        await appContract.methods
            .fetchFlightStatus(
                flight.airlineAddress,
                flight.name,
                flight.timestamp
            )
            .send({ from: account });
    }

    export async function getMaxInsurPremium() {
        return await appContract.methods.MAX_INSUR_PREMIUM.call().call();
    }

    export async function getAirlineRegistrationFee() {
        return await appContract.methods.AIRLINE_REGISTRATION_FEE.call().call();
    }

    export async function getCredit(address) {
        return await appContract.methods.creditOf(address).call();
    }

    export async function pay() {
        const account = await getCurrentAccount();
        await appContract.methods.pay().send({ from: account });
    }

    export async function buyFlightInsur(flight, insuredAmountWei) {
        const account = await getCurrentAccount();
        await appContract.methods
            .buyFlightInsur(
                flight.airlineAddress,
                flight.name,
                flight.timestamp
            )
            .send({ from: account, value: insuredAmountWei });
    }

    export function onDidUpdateAirlineRegistrationStatus(cb) {
        return appContract.events.DidUpdateAirlineRegistrationStatus(
            { fromBlock: "latest" },
            (error, event) => {
                if (!!error) return;
                cb(event.returnValues);
            }
        );
    }

    export function onFlightStatusInfo(cb) {
        return appContract.events.FlightStatusInfo(
            { fromBlock: "latest" },
            (error, event) => {
                if (!!error) return;
                cb(event.returnValues);
            }
        );
    }

    export function onDidRegisterFlight(cb) {
        return appContract.events.DidRegisterFlight(
            { fromBlock: "latest" },
            (error, event) => {
                if (!!error) return;
                cb(event.returnValues);
            }
        );
    }

    export function onDidPay(cb) {
        return appContract.events.DidPay(
            { fromBlock: "latest" },
            (error, event) => {
                if (!!error) return;
                cb(event.returnValues);
            }
        );
    }

    export function onDidBuyInsur(cb) {
        return appContract.events.DidBuyInsur(
            { fromBlock: "latest" },
            (error, event) => {
                if (!!error) return;
                cb(event.returnValues);
            }
        );
    }
</script>

<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";

    const dispatch = createEventDispatcher();
    const subscriptions = [];

    initPromise.then(() => {
        dispatch("didUpdateUser", user);
    });

    async function syncUser() {
        user = await getCurrentUser();
        dispatch("didUpdateUser", user);
    }

    async function syncUserBalance() {
        if (!user) return;
        user.balance = await getBalance(user.address);
        dispatch("didUpdateUser", user);
    }

    window.ethereum.on("accountsChanged", syncUser);

    window.ethereum.on("disconnect", () => {
        user = null;
        dispatch("didUpdateUser", user);
    });

    onMount(async () => {
        await initPromise;

        subscriptions.push(
            onDidUpdateAirlineRegistrationStatus((event) => {
                if (!user) return;
                if (!equalAddresses(user.address, event.airline)) return;
                user.role = getUserRoleByAirlineRegStatus(event.status);
                dispatch("didUpdateUser", user);
            })
        );

        subscriptions.push(onDidPay(syncUserBalance));

        subscriptions.push(onDidBuyInsur(syncUserBalance));
    });

    onDestroy(() => {
        subscriptions.forEach((s) => s.unsubscribe());
    });
</script>
