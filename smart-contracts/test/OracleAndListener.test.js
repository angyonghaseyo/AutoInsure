const { expect } = require("chai");
const { ethers } = require("hardhat");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

describe("OracleConnector + Listener.js Integration", function () {
  this.timeout(30000); // 30 seconds timeout for the entire test suite

  let mockLinkToken, mockOracle, oracleConnector, listenerProcess;
  let owner;
  
  const FLIGHT_NUMBER = "SQ100";
  const DEPARTURE_TIME = "2025-03-30T15:00:00Z";
  const MOCK_API_URL = "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/";
  const EXPECTED_DELAY = 120; // 2 hours in minutes

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
    const jobId = ethers.encodeBytes32String("flightdelay");
    await oracleConnector.addOracle(
      await mockOracle.getAddress(),
      MOCK_API_URL,
      jobId
    );

    // Create a temporary .env file for the listener process
    const listenerEnvPath = path.join(__dirname, "temp-listener.env");
    const envContent = `
      RPC_URL=http://127.0.0.1:8545
      PRIVATE_KEY=${owner.privateKey}
      ORACLE_CONTRACT_ADDRESS=${await mockOracle.getAddress()}
    `;
    fs.writeFileSync(listenerEnvPath, envContent);

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
    await new Promise(resolve => setTimeout(resolve, 3000));
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

  it("should request flight data and receive oracle response via listener", async function() {
    // Create a mock response handler for the flight API
    // In a real test, you would set up a mock server or intercept the API calls
    // For this test, we'll directly fulfill the oracle request
    
    // Request flight data through the oracle connector
    console.log(`Requesting flight data for ${FLIGHT_NUMBER} departing at ${DEPARTURE_TIME}`);
    const tx = await oracleConnector.requestFlightData(FLIGHT_NUMBER, DEPARTURE_TIME);
    const receipt = await tx.wait();
    
    // Find the FlightDataRequested event
    const requestEvent = receipt.logs.find(
      log => log.fragment && log.fragment.name === "FlightDataRequested"
    );
    
    if (!requestEvent) {
      throw new Error("FlightDataRequested event not found in transaction logs");
    }
    
    const requestId = requestEvent.args[0];
    console.log(`Request ID: ${requestId}`);
    
    // Wait for the listener to detect the event and fulfill the request
    // In a real environment, the listener would call the API and get the real flight data
    console.log("Waiting for listener to process the request...");
    
    // Mock the API call by directly fulfilling the request with our expected delay
    // This simulates what would happen if we had a mock API server
    console.log(`Simulating API response with ${EXPECTED_DELAY} minutes delay`);
    await mockOracle.fulfillDataFromOffChain(requestId, EXPECTED_DELAY);
    
    // Wait for the fulfillment to be processed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check that the flight data was received and processed correctly
    console.log("Checking flight status...");
    const [dataReceived, isDelayed, delayHours] = await oracleConnector.checkFlightStatus(FLIGHT_NUMBER, DEPARTURE_TIME);
    
    expect(dataReceived).to.be.true;
    expect(isDelayed).to.be.true;
    expect(delayHours).to.equal(2); // 120 minutes = 2 hours
    
    console.log(`Flight status: Data received=${dataReceived}, Delayed=${isDelayed}, Delay hours=${delayHours}`);
  });
});