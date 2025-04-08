const { expect } = require("chai");
const { ethers } = require("hardhat");
const { spawn } = require("child_process");

require("dotenv").config();

describe("OracleConnector + Listener Integration", function () {
  let deployer, linkToken, mockOracle, oracleConnector;
  let listenerProcess;

  const DUMMY_JOB_ID = ethers.utils.formatBytes32String("mockJobId");
  const FLIGHT_API_URL = "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/"; // returns { "data": { "delay": 45 } }
  const JSON_PATH = "data.delayMinutes";
  const EXPECTED_DATA = "45";

  before(async function () {
    [owner, addr1] = await ethers.getSigners();

    const MockLinkToken = await hre.ethers.getContractFactory("MockLinkToken")
    const mockLinkToken = await MockLinkToken.deploy()
    await mockLinkToken.waitForDeployment();
    const mockLinkTokenAddress = await mockLinkToken.getAddress()
  
    const OracleConnector = await hre.ethers.getContractFactory("OracleConnector")
    const MockOracle = await hre.ethers.getContractFactory("MockOracle")
  
    const oracleConnector = await OracleConnector.deploy(mockLinkTokenAddress)
    await oracleConnector.waitForDeployment()
    const oracleConnectorAddress =await oracleConnector.getAddress()
    console.log(`OracleConnector deployed at: ${oracleConnectorAddress}`)
  
    const mockOracle = await MockOracle.deploy(mockLinkTokenAddress)
    await mockOracle.waitForDeployment()
    const mockOracleAddress = await mockOracle.getAddress()
    console.log(`MockOracle deployed at: ${mockOracleAddress}`)
  
    // 4. Fund the connector with LINK
    const fundAmount = ethers.utils.parseEther("10000000000");
    await mockLinkToken.transfer(oracleConnector.address, fundAmount);

    // Add oracle to the connector
    await oracleConnector.addOracle(
            mockOracleAddress,
            "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/",
            jobId
        );
        
    // 5. Start listener.js in background
    listenerProcess = spawn("node", ["listener.js"]);

    listenerProcess.stdout.on("data", (data) => {
      console.log(`Listener: ${data.toString()}`);
    });

    listenerProcess.stderr.on("data", (data) => {
      console.error(`Listener ERROR: ${data.toString()}`);
    });

    // Give listener a few seconds to boot
    await new Promise((res) => setTimeout(res, 3000));
  });

  after(async function () {
    if (listenerProcess) {
      listenerProcess.kill();
    }
  });

  it("should request flight data and fulfill via listener", async function () {
    const tx = await oracleConnector.requestFlightData(FLIGHT_API_URL, JSON_PATH, DUMMY_JOB_ID);
    const receipt = await tx.wait();

    // Get requestId
    const event = receipt.events.find((e) => e.event === "FlightDataRequested");
    const requestId = event.args.requestId;

    // Wait for listener to fulfill
    await new Promise((res) => setTimeout(res, 8000)); // wait 8 seconds

    // Read emitted event or contract state
    const fulfillFilter = oracleConnector.filters.FlightDataFulfilled(requestId);
    const events = await oracleConnector.queryFilter(fulfillFilter);

    expect(events.length).to.be.greaterThan(0);
    expect(events[0].args.data).to.equal(EXPECTED_DATA);
  });
});