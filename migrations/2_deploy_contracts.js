const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require("fs-extra");

function copyContractsToServer() {
    const src = __dirname + '/../dapp/src/contracts';
    const dest = __dirname + '/../server/contracts';

    fs.ensureDirSync(dest);
    fs.emptyDirSync(dest);
    fs.copySync(src, dest);
}

function createServerConfigFile(appAddress, dataAddress) {
    const filePath = __dirname + '/../server/config.json';
    const config = {
        localhost: {
            url: 'http://localhost:8545',
            dataAddress: dataAddress,
            appAddress: appAddress,
        }
    }
    const configJSON = JSON.stringify(config, null, '\t');

    fs.writeFileSync(filePath, configJSON, 'utf-8');
}

module.exports = async (deployer) => {
    await deployer.deploy(FlightSuretyData);
    await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);
    copyContractsToServer();
    createServerConfigFile(FlightSuretyApp.address, FlightSuretyData.address);
}
