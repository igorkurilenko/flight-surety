<script>
    import {
        Card,
        CardSubtitle,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Button,
        Spinner,
    } from "sveltestrap";
    import { toEther } from "./Utils.svelte";
    import { getCredit, pay } from "./FlightSuretyWeb3.svelte";

    export let user;
    let checkingCredit = false;
    let withdrawing = false;
    let modalOpen = false;
    let creditEth;

    const toggleModal = () => (modalOpen = !modalOpen);

    async function didClickCheckCredit() {
        checkingCredit = true;
        try {
            const creditWei = await getCredit(user.address);
            creditEth = toEther(creditWei);
            toggleModal();
        } catch (e) {
            console.error(`Failed to get credit.\n${e}`);
        }
        checkingCredit = false;
    }

    async function didClickWithdraw() {
        withdrawing = true;
        try {
            await pay(user.address);
            toggleModal();
        } catch (e) {
            console.error(`Failed to pay out credit.\n${e}`);
        }
        withdrawing = false;
    }
</script>

<Card body dark color="dark mt-5 mb-3" inverse style="--bs-bg-opacity: .5;">
    <CardSubtitle class="mb-3">Insurance Payout</CardSubtitle>
    <Button
        size="lg"
        color="primary"
        block
        on:click={didClickCheckCredit}
        disabled={checkingCredit}
    >
        {#if checkingCredit}
            <Spinner size="sm" />
        {/if}
        Check My Credit
    </Button>

    <Modal isOpen={modalOpen} {toggleModal}>
        <ModalHeader {toggleModal}>Credit Amount</ModalHeader>
        <ModalBody>
            <h3 class="font-weight-bold">{creditEth} ETH</h3>
        </ModalBody>
        <ModalFooter>
            <Button
                size="lg"
                color="success"
                disabled={!creditEth || withdrawing}
                on:click={didClickWithdraw}
            >
                {#if withdrawing}
                    <Spinner size="sm" />
                {/if}
                Withdraw
            </Button>
            <Button size="lg" outline color="dark" on:click={toggleModal}>
                Close
            </Button>
        </ModalFooter>
    </Modal>
</Card>
