const moment = require('moment');
const truffleAssert = require('truffle-assertions');
const Config = require('./config');

contract("FlightSuretyApp", function (accounts) {

  let cfg;

  const ensureUnpausedAsync = async (pausable) => {
    const paused = await pausable.paused();
    if (!paused) return;
    await pausable.unpause();
  };

  const ensurePausedAsync = async (pausable) => {
    const paused = await pausable.paused();
    if (paused) return;
    await pausable.pause();
  };

  beforeEach(async () => {
    cfg = await Config.configure(accounts);

    await cfg.dataContract.authorizeCaller(
      cfg.appContract.address
    );
  });

  afterEach(async () => {
    await cfg.appContract.kill();
    await cfg.dataContract.kill();
  });

  describe(`getAirlineRegistrationStatus()`, () => {
    it(`should revert if the contract is paused`, async () => {
      await ensurePausedAsync(cfg.appContract)

      await truffleAssert.reverts(
        cfg.appContract.getAirlineRegistrationStatus(cfg.airline1),
        `Pausable: paused`
      );
    });

    it(`should return REGISTRATION_STATUS_OK for a registered airline`, async () => {
      const registeredAirline = cfg.airline1;
      const regStatus = await cfg.appContract.getAirlineRegistrationStatus(registeredAirline);
      const expected = await cfg.appContract.REGISTRATION_STATUS_OK.call();
      expect(regStatus).to.eql(expected);
    });

    it(`should return REGISTRATION_STATUS_UNKNOWN for unregistered airline`, async () => {
      const unregisteredAirline = cfg.airline2;
      const regStatus = await cfg.appContract.getAirlineRegistrationStatus(unregisteredAirline);
      const expected = await cfg.appContract.REGISTRATION_STATUS_UNKNOWN.call();
      expect(regStatus).to.eql(expected);
    });
  });

  describe(`registerAirline()`, () => {
    it(`should revert if the contract is paused`, async () => {
      await ensurePausedAsync(cfg.appContract);
      const registeredAirline = cfg.airline1;

      await truffleAssert.reverts(
        cfg.appContract.registerAirline(cfg.airline2, { from: registeredAirline }),
        `Pausable: paused`
      );
    });

    it(`should revert if an invalid address passed`, async () => {
      const registeredAirline = cfg.airline5;
      const invalidAddress = cfg.zeroAddress;

      await truffleAssert.reverts(
        cfg.appContract.registerAirline(invalidAddress, { from: registeredAirline }),
        `Invalid airline address`
      );
    });

    it(`should revert if a caller isn't a registered airline`, async () => {
      const unregisteredAirline = cfg.airline5;

      await truffleAssert.reverts(
        cfg.appContract.registerAirline(cfg.airline2, { from: unregisteredAirline }),
        `Caller is not a registered airline`
      );
    });

    it(`should revert if an airline already registered`, async () => {
      const registeredAirline = cfg.airline1;

      await truffleAssert.reverts(
        cfg.appContract.registerAirline(registeredAirline, { from: registeredAirline }),
        `Airline is already registered`
      );
    });

    it(`should approve airline for registration`, async () => {
      const registeredAirline = cfg.airline1;

      await cfg.appContract.registerAirline(cfg.airline2, { from: registeredAirline });
      const regStatus = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline2);
      const expected = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
      expect(regStatus).to.eql(expected);
    });

    it(`should init a voting for registration starting from a fifth airline`, async () => {
      const registeredAirline = cfg.airline1;

      await cfg.appContract.registerAirline(cfg.airline2, { from: registeredAirline });
      const regStatus2 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline2);
      const expected2 = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
      expect(regStatus2).to.eql(expected2);

      await cfg.appContract.registerAirline(cfg.airline3, { from: registeredAirline });
      const regStatus3 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline3);
      const expected3 = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
      expect(regStatus3).to.eql(expected3);

      await cfg.appContract.registerAirline(cfg.airline4, { from: registeredAirline });
      const regStatus4 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline4);
      const expected4 = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
      expect(regStatus4).to.eql(expected4);

      await cfg.appContract.registerAirline(cfg.airline5, { from: registeredAirline });
      const regStatus5 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline5);
      const expected5 = await cfg.appContract.REGISTRATION_STATUS_VOTING.call();
      expect(regStatus5).to.eql(expected5);
    });

    it(`should revert if a caller has alredy voted`, async () => {
      const registeredAirline = cfg.airline1;

      await cfg.appContract.registerAirline(cfg.airline2, { from: registeredAirline });
      await cfg.appContract.registerAirline(cfg.airline3, { from: registeredAirline });
      await cfg.appContract.registerAirline(cfg.airline4, { from: registeredAirline });
      await cfg.appContract.registerAirline(cfg.airline5, { from: registeredAirline });

      await truffleAssert.reverts(
        cfg.appContract.registerAirline(cfg.airline5, { from: registeredAirline }),
        `Already voted`
      );
    });
  });

  describe(`pause()`, () => {
    it(`should pause the contract`, async () => {
      await cfg.appContract.pause();

      const result = await cfg.appContract.paused();
      const expected = true;

      assert.equal(result, expected);
    });

    it(`should revert if the contract is paused`, async () => {
      await ensurePausedAsync(cfg.appContract)

      await truffleAssert.reverts(
        cfg.appContract.pause(),
        `Pausable: paused`
      );
    });

    it(`should revert if a caller isn't the contract owner`, async () => {
      await truffleAssert.reverts(
        cfg.appContract.pause({ from: cfg.airline2 }),
        `Ownable: caller is not the owner`
      );
    });
  });

  describe(`unpause()`, () => {
    it(`should unpause the contract`, async () => {
      await ensurePausedAsync(cfg.appContract);

      await cfg.appContract.unpause();

      const result = await cfg.appContract.paused();
      const expected = false;

      assert.equal(result, expected);
    });

    it(`should revert if the contract is unpaused`, async () => {
      await ensureUnpausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.unpause(),
        `Pausable: not paused`
      );
    });

    it(`should revert if a caller isn't the contract owner`, async () => {
      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.unpause({ from: cfg.airline2 }),
        `Ownable: caller is not the owner`
      );
    });
  });

  describe(`registerFlight()`, () => {
    it(`should revert if an airline isn't registered`, async () => {
      const unregisteredAirline = cfg.airline2;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      const regStatus = await cfg.appContract.getAirlineRegistrationStatus(unregisteredAirline);
      const expected = await cfg.appContract.REGISTRATION_STATUS_UNKNOWN.call();
      expect(regStatus).to.eql(expected);

      await truffleAssert.reverts(
        cfg.appContract.registerFlight(flight, timestamp, { from: unregisteredAirline }),
        `Only registered airline allowed`
      );
    });

    it(`should revert if the contract is paused`, async () => {
      const registeredAirline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      const regStatus = await cfg.appContract.getAirlineRegistrationStatus(registeredAirline);
      const expected = await cfg.appContract.REGISTRATION_STATUS_OK.call();
      expect(regStatus).to.eql(expected);

      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.registerFlight(flight, timestamp, { from: registeredAirline }),
        `Pausable: paused`
      );
    });

    it(`should register a flight and emit DidRegisterFlight event`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      const regStatus = await cfg.appContract.getAirlineRegistrationStatus(airline);
      const expected = await cfg.appContract.REGISTRATION_STATUS_OK.call();
      expect(regStatus).to.eql(expected);

      const result = await cfg.appContract.registerFlight(flight, timestamp, { from: airline });
      truffleAssert.eventEmitted(result, 'DidRegisterFlight', (ev) => {
        return ev.airline === airline &&
          ev.flight === flight &&
          ev.timestamp.toNumber() === timestamp;
      });
    });
  });

  describe(`isFlightRegistered()`, () => {
    it(`should revert if the contract is paused`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.isFlightRegistered(airline, flight, timestamp),
        `Pausable: paused`
      );
    });

    it(`should return true if a flight is registered`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      const regStatus = await cfg.appContract.getAirlineRegistrationStatus(airline);
      const expected1 = await cfg.appContract.REGISTRATION_STATUS_OK.call();
      expect(regStatus).to.eql(expected1);

      await cfg.appContract.registerFlight(flight, timestamp, { from: airline });

      const registered = await cfg.appContract.isFlightRegistered(airline, flight, timestamp);
      const expected2 = true;
      assert.equal(registered, expected2);
    });

    it(`should return false if a flight isn't registered`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      const registered = await cfg.appContract.isFlightRegistered(airline, flight, timestamp);
      const expected = false;
      assert.equal(registered, expected);
    });
  });

  describe(`fund()`, () => {
    it(`should revert if the contract is paused`, async () => {
      const fee = await cfg.appContract.AIRLINE_REGISTRATION_FEE.call();

      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.fund({ from: cfg.airline1, value: fee }),
        `Pausable: paused`
      );
    });

    it(`should revert if an airline isn't in the registration queue`, async () => {
      const registeredAirline = cfg.airline1;
      const unregisteredAirline = cfg.airline2;
      const fee = await cfg.appContract.AIRLINE_REGISTRATION_FEE.call();

      await truffleAssert.reverts(
        cfg.appContract.fund({ from: registeredAirline, value: fee }),
        `Airline isn't in the registration queue`
      );

      await truffleAssert.reverts(
        cfg.appContract.fund({ from: unregisteredAirline, value: fee }),
        `Airline isn't in the registration queue`
      );
    });

    it(`should revert if an insufficient registration fee provided`, async () => {
      const BN = web3.utils.BN;
      const registeredAirline = cfg.airline1;
      const fee = await cfg.appContract.AIRLINE_REGISTRATION_FEE.call();
      const insufficientFee = fee.div(new BN(2));

      await cfg.appContract.registerAirline(cfg.airline2, { from: registeredAirline });
      const regStatus = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline2);
      const expected = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
      expect(regStatus).to.eql(expected);

      await truffleAssert.reverts(
        cfg.appContract.fund({ from: cfg.airline2, value: insufficientFee }),
        `Insufficient fee for airline registration`
      );
    });

    it(`should complete an airline registration`, async () => {
      const fee = await cfg.appContract.AIRLINE_REGISTRATION_FEE.call();
      const registeredAirline = cfg.airline1;

      await cfg.appContract.registerAirline(cfg.airline2, { from: registeredAirline });
      const regStatus1 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline2);
      const expected1 = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
      expect(regStatus1).to.eql(expected1);

      await cfg.appContract.fund({ from: cfg.airline2, value: fee });
      const regStatus2 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline2);
      const expected2 = await cfg.appContract.REGISTRATION_STATUS_OK.call();
      expect(regStatus2).to.eql(expected2);
    });

    it(`should return change`, async () => {
      const BN = web3.utils.BN;
      const fee = await cfg.appContract.AIRLINE_REGISTRATION_FEE.call();
      const redundantFee = fee.add(new BN(web3.utils.toWei('1', 'ether')));
      const registeredAirline = cfg.airline1;

      await cfg.appContract.registerAirline(cfg.airline2, { from: registeredAirline });
      const regStatus1 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline2);
      const expected1 = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
      expect(regStatus1).to.eql(expected1);

      const balanceBefore = await web3.eth.getBalance(cfg.airline2);

      await cfg.appContract.fund({ from: cfg.airline2, value: redundantFee });
      const regStatus2 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline2);
      const expected2 = await cfg.appContract.REGISTRATION_STATUS_OK.call();
      expect(regStatus2).to.eql(expected2);

      const balanceAfter = await web3.eth.getBalance(cfg.airline2);
      const actualFee = new BN(balanceBefore).sub(new BN(balanceAfter));
      expect(actualFee.lt(redundantFee)).to.be.true;
    });
  });

  describe(`fetchFlightStatus()`, () => {
    it(`should revert if the contract is paused`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.fetchFlightStatus(airline, flight, timestamp),
        `Pausable: paused`
      );
    });

    it(`should revert if a flight isn't registered`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      await truffleAssert.reverts(
        cfg.appContract.fetchFlightStatus(airline, flight, timestamp),
        `Flight must be registered`
      );
    });

    it(`should emit OracleRequest event`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      const regStatus = await cfg.appContract.getAirlineRegistrationStatus(airline);
      const expected = await cfg.appContract.REGISTRATION_STATUS_OK.call();
      expect(regStatus).to.eql(expected);

      await cfg.appContract.registerFlight(flight, timestamp, { from: airline });

      const result = await cfg.appContract.fetchFlightStatus(airline, flight, timestamp);
      truffleAssert.eventEmitted(result, 'OracleRequest', (ev) => {
        return ev.airline === airline &&
          ev.flight === flight &&
          ev.timestamp.toNumber() === timestamp;
      });
    });
  });

  describe(`registerOracle()`, () => {
    it(`should revert if the contract is paused`, async () => {
      const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();
      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.registerOracle({ from: cfg.oracle1, value: fee }),
        `Pausable: paused`
      );
    });

    it(`should revert if an oracle has already been registered`, async () => {
      const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();

      await cfg.appContract.registerOracle({ from: cfg.oracle1, value: fee });

      await truffleAssert.reverts(
        cfg.appContract.registerOracle({ from: cfg.oracle1, value: fee }),
        `Oracle has already been registered`
      );
    });

    it(`should revert if an insufficient registration fee provided`, async () => {
      const BN = web3.utils.BN;
      const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();
      const insufficientFee = fee.div(new BN(2));

      await truffleAssert.reverts(
        cfg.appContract.registerOracle({ from: cfg.oracle1, value: insufficientFee }),
        `Insufficient fee for oracle registration`
      );
    });

    it(`should return change`, async () => {
      const BN = web3.utils.BN;
      const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();
      const redundantFee = fee.add(new BN(web3.utils.toWei('1', 'ether')));
      const balanceBefore = await web3.eth.getBalance(cfg.oracle1);

      await cfg.appContract.registerOracle({ from: cfg.oracle1, value: redundantFee });

      const balanceAfter = await web3.eth.getBalance(cfg.oracle1);
      const actualFee = new BN(balanceBefore).sub(new BN(balanceAfter));
      expect(actualFee.lt(redundantFee)).to.be.true;
    });

    it(`should emit DidRegisterOracle event`, async () => {
      const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();

      const result = await cfg.appContract.registerOracle({ from: cfg.oracle1, value: fee });
      truffleAssert.eventEmitted(result, 'DidRegisterOracle', (ev) => {
        return ev.oracle === cfg.oracle1;
      });
    });
  });

  describe(`isRegisteredAsOracle()`, () => {
    it(`should revert if the contract is paused`, async () => {
      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.isRegisteredAsOracle(cfg.oracle1),
        `Pausable: paused`
      );
    });

    it(`should return true if an account is registered as oracle`, async () => {
      const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();
      await cfg.appContract.registerOracle({ from: cfg.oracle1, value: fee });

      const registered = await cfg.appContract.isRegisteredAsOracle(cfg.oracle1);
      expect(registered).to.be.true;
    });

    it(`should return false if an account isn't registered as oracle`, async () => {
      const registered = await cfg.appContract.isRegisteredAsOracle(cfg.oracle1);
      expect(registered).to.be.false;
    });
  });

  describe(`getOracleIndexes()`, () => {
    it(`should revert if the contract is paused`, async () => {
      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.getOracleIndexes({ from: cfg.oracle1 }),
        `Pausable: paused`
      );
    });

    it(`should revert if a caller isn't registered as an oracle`, async () => {
      await truffleAssert.reverts(
        cfg.appContract.getOracleIndexes({ from: cfg.oracle1 }),
        `Not registered as an oracle`
      );
    });

    it(`should return three indexes`, async () => {
      const BN = web3.utils.BN;
      const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();
      await cfg.appContract.registerOracle({ from: cfg.oracle1, value: fee });

      const indexes = await cfg.appContract.getOracleIndexes({ from: cfg.oracle1 });
      const expected = 3;
      assert.equal(indexes.length, expected);

      for (let i = 0; i < indexes.length; i++) {
        expect(BN.isBN(indexes[i])).to.be.true;
      }
    });
  });

  describe(`submitOracleResponse()`, () => {
    it(`should revert if the contract is paused`, async () => {
      const index = 0;
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();
      const status = 20;

      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.submitOracleResponse(index, airline, flight, timestamp, status, { from: cfg.oracle1 }),
        `Pausable: paused`
      );
    });

    it(`should revert if a caller isn't registered as an oracle`, async () => {
      const index = 0;
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();
      const status = 20;

      await truffleAssert.reverts(
        cfg.appContract.submitOracleResponse(index, airline, flight, timestamp, status, { from: cfg.oracle1 }),
        `Not registered as an oracle`
      );
    });

    it(`should revert if a flight isn't registered`, async () => {
      const index = 0;
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();
      const status = 20;

      const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();
      await cfg.appContract.registerOracle({ from: cfg.oracle1, value: fee });

      await truffleAssert.reverts(
        cfg.appContract.submitOracleResponse(index, airline, flight, timestamp, status, { from: cfg.oracle1 }),
        `Flight must be registered`
      );
    });

    it(`should revert if the submitted index doesn't match oracle`, async () => {
      const wrongIndex = 100;
      const registeredAirline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();
      const status = 20;

      await cfg.appContract.registerFlight(flight, timestamp, { from: registeredAirline });

      const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();
      await cfg.appContract.registerOracle({ from: cfg.oracle1, value: fee });

      await truffleAssert.reverts(
        cfg.appContract.submitOracleResponse(wrongIndex, registeredAirline, flight, timestamp, status, { from: cfg.oracle1 }),
        `Index does not match oracle`
      );
    });
  });

  describe(`buyFlightInsur()`, () => {
    it(`should revert if the contract is paused`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.buyFlightInsur(airline, flight, timestamp, { from: cfg.passenger1 }),
        `Pausable: paused`
      );
    });

    it(`should revert if a flight isn't registered`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      await truffleAssert.reverts(
        cfg.appContract.buyFlightInsur(airline, flight, timestamp, { from: cfg.passenger1 }),
        `Unknown flight`
      );
    });

    it(`should revert if no value sent`, async () => {
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      await cfg.appContract.registerFlight(flight, timestamp, { from: airline });

      await truffleAssert.reverts(
        cfg.appContract.buyFlightInsur(airline, flight, timestamp, { from: cfg.passenger1 }),
        `Value required`
      );
    });

    it(`should revert if sent value is greater then max allowed premium`, async () => {
      const BN = web3.utils.BN;
      const maxPremium = await cfg.appContract.MAX_INSUR_PREMIUM.call();
      const invalidValue = maxPremium.add(new BN(web3.utils.toWei('1', 'ether')));
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      await cfg.appContract.registerFlight(flight, timestamp, { from: airline });

      await truffleAssert.reverts(
        cfg.appContract.buyFlightInsur(airline, flight, timestamp, { from: cfg.passenger1, value: invalidValue }),
        `Payment amount exceeds the max allowed insurance premium`
      );
    });

    it(`should revert if the fund is insufficient to sell the insurance`, async () => {
      const maxPremium = await cfg.appContract.MAX_INSUR_PREMIUM.call();
      const airline = cfg.airline1;
      const flight = `SU-1627`;
      const timestamp = moment().unix();

      await cfg.appContract.registerFlight(flight, timestamp, { from: airline });

      await truffleAssert.reverts(
        cfg.appContract.buyFlightInsur(airline, flight, timestamp, { from: cfg.passenger1, value: maxPremium }),
        `Insuficcient fund to sell the insurance`
      );
    });
  });

  describe(`creditOf()`, () => {
    it(`should revert if the contract is paused`, async () => {
      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.creditOf(cfg.passenger1),
        `Pausable: paused`
      );
    });
  });

  describe(`pay()`, () => {
    it(`should revert if the contract is paused`, async () => {
      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.pay({ from: cfg.passenger1 }),
        `Pausable: paused`
      );
    });
  });

  describe(`renounceOwnership()`, () => {
    it(`should revert if the contract is paused`, async () => {
      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.renounceOwnership(),
        `Pausable: paused`
      );
    });

    it(`should revert if a caller isn't the owner`, async () => {
      await truffleAssert.reverts(
        cfg.appContract.renounceOwnership({ from: cfg.passenger1 }),
        `Ownable: caller is not the owner`
      );
    });
  });

  describe(`transferOwnership()`, () => {
    it(`should revert if the contract is paused`, async () => {
      await ensurePausedAsync(cfg.appContract);

      await truffleAssert.reverts(
        cfg.appContract.transferOwnership(cfg.airline2),
        `Pausable: paused`
      );
    });

    it(`should revert if a caller isn't the owner`, async () => {
      await truffleAssert.reverts(
        cfg.appContract.transferOwnership(cfg.airline2, { from: cfg.airline2 }),
        `Ownable: caller is not the owner`
      );
    });
  });

  it(`first airline should be registered when contract is deployed`, async () => {
    const airline = cfg.airline1;
    const regStatus = await cfg.appContract.getAirlineRegistrationStatus(airline);
    const expected1 = await cfg.appContract.REGISTRATION_STATUS_OK.call();
    expect(regStatus).to.eql(expected1);
  });

  it(`only existing airline may register a new airline until there are at least four airlines registered`, async () => {
    const registeredAirline = cfg.airline1;
    const unregisteredAirline = cfg.airline5;

    await truffleAssert.reverts(
      cfg.appContract.registerAirline(cfg.airline3, { from: unregisteredAirline }),
      `Caller is not a registered airline`,
      `unregistered airline did register new airline`
    );

    await cfg.appContract.registerAirline(cfg.airline2, { from: registeredAirline });
    const regStatus2 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline2);
    const expected2 = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
    expect(regStatus2).to.eql(expected2);

    await cfg.appContract.registerAirline(cfg.airline3, { from: registeredAirline });
    const regStatus3 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline3);
    const expected3 = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
    expect(regStatus3).to.eql(expected3);

    await cfg.appContract.registerAirline(cfg.airline4, { from: registeredAirline });
    const regStatus4 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline4);
    const expected4 = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
    expect(regStatus4).to.eql(expected4);

    await cfg.appContract.registerAirline(cfg.airline5, { from: registeredAirline });
    const regStatus5 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline5);
    const expected5 = await cfg.appContract.REGISTRATION_STATUS_VOTING.call();
    expect(regStatus5).to.eql(expected5);
  });

  it(`registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines`, async () => {
    const registeredAirline = cfg.airline1;
    await cfg.appContract.registerAirline(cfg.airline2, { from: registeredAirline });
    await cfg.appContract.registerAirline(cfg.airline3, { from: registeredAirline });
    await cfg.appContract.registerAirline(cfg.airline4, { from: registeredAirline });

    const fee = await cfg.appContract.AIRLINE_REGISTRATION_FEE.call();
    await cfg.appContract.fund({ from: cfg.airline2, value: fee });

    await cfg.appContract.registerAirline(cfg.airline5, { from: registeredAirline });
    const regStatus1 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline5);
    const expected1 = await cfg.appContract.REGISTRATION_STATUS_VOTING.call();
    expect(regStatus1).to.eql(expected1);

    await cfg.appContract.registerAirline(cfg.airline5, { from: cfg.airline2 });
    const regStatus2 = await cfg.appContract.getAirlineRegistrationStatus(cfg.airline5);
    const expected2 = await cfg.appContract.REGISTRATION_STATUS_APPROVED.call();
    expect(regStatus2).to.eql(expected2);
  });

  it(`if flight is delayed due to airline fault, passenger receives credit of 1.5X the amount they paid`, async () => {
    const BN = web3.utils.BN;
    const airline = cfg.airline1;
    const flight = `SU-1627`;
    const timestamp = moment().unix();
    const status = 20;
    const oraclesByIndex = new Map();

    // 1. Prepare environment: register flight, 
    // register new airline to top up the fund, 
    // buy couple insurs, register oracles.

    await cfg.appContract.registerFlight(flight, timestamp, { from: airline });

    await cfg.appContract.registerAirline(cfg.airline2, { from: airline });
    const registerAirlineFee = await cfg.appContract.AIRLINE_REGISTRATION_FEE.call();
    await cfg.appContract.fund({ from: cfg.airline2, value: registerAirlineFee });

    const buyResult1 = await cfg.appContract.buyFlightInsur(airline, flight, timestamp, { from: cfg.passenger1, value: web3.utils.toWei('1', 'ether') });
    truffleAssert.eventEmitted(buyResult1, 'DidBuyInsur', (ev) => {
      return ev.insuree === cfg.passenger1 &&
        ev.sumInsured.eq(new BN(web3.utils.toWei('1.5', 'ether')));
    });

    const buyResult2 = await cfg.appContract.buyFlightInsur(airline, flight, timestamp, { from: cfg.passenger2, value: web3.utils.toWei('1', 'ether') });
    truffleAssert.eventEmitted(buyResult2, 'DidBuyInsur', (ev) => {
      return ev.insuree === cfg.passenger2 &&
        ev.sumInsured.eq(new BN(web3.utils.toWei('1.5', 'ether')));
    });

    const fee = await cfg.appContract.ORACLE_REGISTRATION_FEE.call();
    for (let i = 0; i < accounts.length; i++) {
      const oracle = accounts[i];

      await cfg.appContract.registerOracle({ from: oracle, value: fee });

      const indexes = await cfg.appContract.getOracleIndexes({ from: oracle });

      indexes.forEach((index) => {
        const oracles = oraclesByIndex.get(index.toNumber()) || [];
        oracles.push(oracle);
        oraclesByIndex.set(index.toNumber(), oracles);
      })
    }

    // 2. Simulate airline fault.

    let index = 0;
    const fetchStatusResult = await cfg.appContract.fetchFlightStatus(airline, flight, timestamp);
    truffleAssert.eventEmitted(fetchStatusResult, 'OracleRequest', (ev) => {
      index = ev.index.toNumber();
      return ev.airline === airline &&
        ev.flight === flight &&
        ev.timestamp.toNumber() === timestamp;
    });

    const oracles = oraclesByIndex.get(index);

    expect(oracles.length > 0).to.be.true;

    const submitOracleRespResult1 = await cfg.appContract.submitOracleResponse(index, airline, flight, timestamp, status, { from: oracles[0] });
    truffleAssert.eventEmitted(submitOracleRespResult1, 'DidGetOracleReport', (ev) => {
      return ev.airline === airline &&
        ev.flight === flight &&
        ev.timestamp.toNumber() === timestamp &&
        ev.status.toNumber() === status;
    });

    const submitOracleRespResult2 = await cfg.appContract.submitOracleResponse(index, airline, flight, timestamp, status, { from: oracles[0] });
    truffleAssert.eventEmitted(submitOracleRespResult2, 'DidGetOracleReport', (ev) => {
      return ev.airline === airline &&
        ev.flight === flight &&
        ev.timestamp.toNumber() === timestamp &&
        ev.status.toNumber() === status;
    });

    const submitOracleRespResult3 = await cfg.appContract.submitOracleResponse(index, airline, flight, timestamp, status, { from: oracles[0] });
    truffleAssert.eventEmitted(submitOracleRespResult3, 'DidGetOracleReport', (ev) => {
      return ev.airline === airline &&
        ev.flight === flight &&
        ev.timestamp.toNumber() === timestamp &&
        ev.status.toNumber() === status;
    });
    truffleAssert.eventEmitted(submitOracleRespResult3, 'FlightStatusInfo', (ev) => {
      return ev.airline === airline &&
        ev.flight === flight &&
        ev.timestamp.toNumber() === timestamp &&
        ev.status.toNumber() === status;
    });

    // 3. pay

    const balanceBefore1 = await web3.eth.getBalance(cfg.passenger1);
    const balanceBefore2 = await web3.eth.getBalance(cfg.passenger2);

    await cfg.appContract.pay({ from: cfg.passenger1 });
    await cfg.appContract.pay({ from: cfg.passenger2 });

    const balanceAfter1 = await web3.eth.getBalance(cfg.passenger1);
    const balanceAfter2 = await web3.eth.getBalance(cfg.passenger2);

    const paid1 = new BN(balanceAfter1).sub(new BN(balanceBefore1));
    const paid2 = new BN(balanceAfter2).sub(new BN(balanceBefore2));

    expect(paid1.gt(new BN(web3.utils.toWei('1.49', 'ether')))).to.be.true;
    expect(paid2.gt(new BN(web3.utils.toWei('1.49', 'ether')))).to.be.true;
  });
});
