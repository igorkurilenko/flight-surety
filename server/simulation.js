const FlightSuretyApp = require('./contracts/FlightSuretyApp.json');
const FlightSuretyData = require('./contracts/FlightSuretyData.json');
const Config = require('./config.json');
const Web3 = require('web3');


const ReservedAccountsNumber = 10;
const FlightStatus = {
    unknown: 0,
    onTime: 10,
    lateAirline: 20,
    lateWeather: 30,
    lateTechnical: 40,
    lateOther: 50
};


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function getRandomFlightStatusCode() {
    const keys = Object.keys(FlightStatus);
    const key = keys[getRandomInt(keys.length)];

    return FlightStatus[key];
}

Array.prototype.shuffle = function () {
    var i = this.length;
    while (i) {
        var j = Math.floor(Math.random() * i);
        var t = this[--i];
        this[i] = this[j];
        this[j] = t;
    }
    return this;
}

class OraclesRegistry {
    constructor() {
        this.oracles = [];
        this.oraclesByIndex = new Map();
    }

    add(oracle) {
        this.oracles.push(oracle);

        for (let j = 0; j < oracle.indexes.length; j++) {
            let idx = oracle.indexes[j];
            let oracles = this.get(idx) || [];
            oracles.push(oracle);
            this.set(idx, oracles);
        }
    }

    get(idx) {
        return this.oraclesByIndex.get(idx) || [];
    }

    set(idx, oracles) {
        idx && this.oraclesByIndex.set(idx, oracles || []);
    }

    size() {
        return this.oracles.length;
    }
}

const simulation = (function () {
    const config = Config['localhost'];
    const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
    const appContract = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    const dataContract = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

    function noop() { }

    async function throwIfAnyContractPaused() {
        const appContractPaused = await appContract.methods.paused().call();

        if (appContractPaused) {
            throw 'Simulataion is not possible: app contract is paused';
        }

        const dataContractPaused = await dataContract.methods.paused().call();

        if (dataContractPaused) {
            throw 'Simulataion is not possible: data contract is paused';
        }
    }

    async function initAccounts() {
        const accounts = await web3.eth.getAccounts();

        if (accounts.length < ReservedAccountsNumber) {
            throw 'Insufficient accounts number to run simultaion with oracles';
        }

        config.owner = accounts[0];
        config.accounts = accounts;
    }

    async function ensureAppContractAuthorized() {
        await dataContract.methods.authorizeCaller(config.appAddress).send({ from: config.owner, gas: 500000 });
    }

    async function ensureOraclesRegistered() {
        const oracleFee = await appContract.methods.ORACLE_REGISTRATION_FEE().call();
        const oraclesRegistry = new OraclesRegistry();

        for (let i = ReservedAccountsNumber; i < config.accounts.length; i++) {
            let oracleAddress = config.accounts[i];
            let registered = await appContract.methods.isRegisteredAsOracle(oracleAddress).call();

            if (!registered) {
                await appContract.methods.registerOracle().send({ from: oracleAddress, value: oracleFee, gas: 500000 });
            }

            let oracleIndexes = await appContract.methods.getOracleIndexes().call({ from: oracleAddress });

            oraclesRegistry.add({
                address: oracleAddress,
                indexes: oracleIndexes,
                randomFlightStatus: getRandomFlightStatusCode()
            });
        }

        return oraclesRegistry;
    }

    const handleOracleRequests = (oraclesRegistry) => {
        appContract.events.OracleRequest({ fromBlock: 'latest' }, async (error, event) => {
            if (!!error) {
                console.log(error);
                return;
            }

            const { index, airline, flight, timestamp } = event.returnValues;

            oraclesRegistry.get(index).shuffle().forEach(async (oracle) => {
                try {
                    await appContract.methods.submitOracleResponse(index, airline, flight, timestamp, oracle.randomFlightStatus)
                        .send({ from: oracle.address, gas: 500000 })
                } catch (e) {
                    console.log('Failed to submit oracle response: ' + e);
                }
            });
        });
    };

    async function run(simulation) {
        simulation.run = noop;

        try {
            await throwIfAnyContractPaused();

            console.log('Initializing accounts...');
            await initAccounts();
            console.log('Initialized ' + config.accounts.length + ' accounts');

            await ensureAppContractAuthorized();

            console.log('Initializing oracles...');
            const oraclesRegistry = await ensureOraclesRegistered();
            console.log('Initialized ' + oraclesRegistry.size() + ' oracles');

            handleOracleRequests(oraclesRegistry);

            simulation.initialized = true;

            simulation.getOraclesNumber = () => {
                return oraclesRegistry.size();
            }
        } catch (e) {
            console.error(e);
            simulation.error = e;
        }
    };


    const simulation = {};
    simulation.initialized = false;
    simulation.getOraclesNumber = noop
    simulation.run = async () => {
        await run(simulation);
    };

    return simulation;
})();

module.exports = simulation;