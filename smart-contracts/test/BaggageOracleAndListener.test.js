const { expect } = require("chai");
const { ethers } = require("hardhat");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

describe("OracleConnector + Listener.js Integration for Baggage", function () {
  this.timeout(30000); // 30 seconds timeout for the entire test suite

  let mockLinkToken, mockOracle, oracleConnector, listenerProcess;
  let owner;
  
  const FLIGHT_NUMBER = "SQ100";
  const DEPARTURE_TIME = "1744992558";
  const BAGGAGE_DES = "GreenLuggage"
  const MOCK_API_URL = "https://c5f06716-b81d-4e73-b825-1289c0745221.mock.pstmn.io/";

  before(async function() {
    console.log("Setting up test environment...");
    [owner] = await ethers.getSigners();

    // Deploy mock LINK token
    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    mockLinkToken = await MockLinkToken.deploy();
    await mockLinkToken.waitForDeployment();
    console.log(`MockLinkToken deployed at: ${await mockLinkToken.getAddress()}`);

    // Deploy mock oracle
    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy(await mockLinkToken.getAddress());
    await mockOracle.waitForDeployment();
    console.log(`MockOracle deployed at: ${await mockOracle.getAddress()}`);

    // Deploy oracle connector
    const OracleConnector = await ethers.getContractFactory("OracleConnector");
    oracleConnector = await OracleConnector.deploy(await mockLinkToken.getAddress());
    await oracleConnector.waitForDeployment();
    console.log(`OracleConnector deployed at: ${await oracleConnector.getAddress()}`);

    // Fund the oracle connector with LINK tokens
    await mockLinkToken.transfer(await oracleConnector.getAddress(), ethers.parseEther("100"));
    
    // Register mock oracle with connector
    const jobId = ethers.encodeBytes32String("baggagedelay");
    await oracleConnector.addOracle(
      await mockOracle.getAddress(),
      MOCK_API_URL,
      jobId
    );

    // Create a .env file for the listener process 
    // private key is the first hardhat code key
    const listenerEnvPath = path.join(__dirname, "../listener/.env");
    const envContent = `
      RPC_URL=http://127.0.0.1:8545
      PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
      ORACLE_CONTRACT_ADDRESS=${await mockOracle.getAddress()}
    `;
    fs.writeFileSync(listenerEnvPath, envContent);

    console.log(`Test ${await mockOracle.getAddress()}`)

    // Start the listener process
    console.log("Starting listener process...");
    // Instead of using the invalid private key from .env, 
    // we'll use the default Hardhat private key for testing
    const hardhatPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const listenerPath = path.join(__dirname, "../listener/listener.js");
    listenerProcess = spawn("node", [listenerPath], {
      env: {
        ...process.env,
        RPC_URL: "http://127.0.0.1:8545",
        PRIVATE_KEY: hardhatPrivateKey, // Use the hardhat test account private key
        ORACLE_CONTRACT_ADDRESS: await mockOracle.getAddress(),
        // Point to our temporary env file
        DOTENV_CONFIG_PATH: listenerEnvPath
      }
    });

    // Log listener output
    listenerProcess.stdout.on("data", (data) => {
      console.log(`Listener: ${data}`);
    });

    listenerProcess.stderr.on("data", (data) => {
      console.error(`Listener Error: ${data}`);
    });

    // Wait for listener to boot up
    console.log("Waiting for listener to start...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Listener Started')
  });

  after(async function() {
    // Clean up the listener process
    if (listenerProcess) {
      console.log("Terminating listener process...");
      listenerProcess.kill();
    }
    
    // Remove temporary env file if it exists
    const listenerEnvPath = path.join(__dirname, "temp-listener.env");
    if (fs.existsSync(listenerEnvPath)) {
      fs.unlinkSync(listenerEnvPath);
    }
  });


  it("should request baggage data and receive oracle response via listener", async function() {    
    // Request flight data through the oracle connector
    console.log(`Requesting Baggage data for ${FLIGHT_NUMBER} departing at ${DEPARTURE_TIME} with description ${BAGGAGE_DES}`);
    
    const tx = await oracleConnector.requestBaggageData(FLIGHT_NUMBER, DEPARTURE_TIME, BAGGAGE_DES);
    // Making sure event actually emitted
    // const logs = await mockOracle.queryFilter("OracleRequest");
    // console.log("OracleRequest logs:", logs);
    const receipt = await tx.wait();

    // Find the FlightDataRequested event
    const requestEvent = receipt.logs.find(
          log => log.fragment && log.fragment.name === "BaggageDataRequested"
    );
        
    if (!requestEvent) {
        throw new Error("BaggageDataRequested event not found in transaction logs");
    }
    
    const requestId = requestEvent.args[0];
    console.log(`Request ID: ${requestId}`);
    console.log("Waiting for listener to process the request...");
    
    // Wait for the fulfillment to be processed
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // check if any callback failure from mock oracle to oracle connector
    const logs = await mockOracle.queryFilter("CallbackFailure");
    console.log("TestCallback logs:", logs)

    // Check that the flight data was received and processed correctly
    console.log("Checking baggage status...");
    const [dataReceived, baggageStatus] = await oracleConnector.checkBaggageStatus(FLIGHT_NUMBER, DEPARTURE_TIME, BAGGAGE_DES);

    console.log(`Data Recieved ${dataReceived}, BaggageStatus ${baggageStatus}`)
    
    expect(dataReceived).to.be.true;
    expect(baggageStatus).to.be.true;

    console.log(`Baggage status: Data received=${dataReceived}, Baggage Status ${baggageStatus}`);
  });

});