const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");

const configure = async function (accounts) {
    const testAddresses = [
        "0x69e1CB5cFcA8A311586e3406ed0301C06fb839a2",
        "0xF014343BDFFbED8660A9d8721deC985126f189F3",
        "0x0E79EDbD6A727CfeE09A2b1d0A59F7752d5bf7C9",
        "0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4",
        "0xa23eAEf02F9E0338EEcDa8Fdd0A73aDD781b2A86",
        "0x6b85cc8f612d5457d49775439335f83e12b8cfde",
        "0xcbd22ff1ded1423fbc24a7af2148745878800024",
        "0xc257274276a4e539741ca11b590b9447b26a8051",
        "0x2f2899d6d35b1a48a4fbdc93a37a72f264a9fca7"
    ];

    const flightSuretyData = await FlightSuretyData.new();
    const flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    return {
        owner: accounts[0],
        airline1: accounts[0],
        airline2: accounts[1],
        airline3: accounts[2],
        airline4: accounts[3],
        airline5: accounts[4],
        passenger1: accounts[5],
        passenger2: accounts[6],
        oracle1: accounts[7],
        oracle2: accounts[8],
        testAddresses: testAddresses,
        zeroAddress: '0x0000000000000000000000000000000000000000',
        dataContract: flightSuretyData,
        appContract: flightSuretyApp
    }
}

module.exports = {
    configure: configure
};