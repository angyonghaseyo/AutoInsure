const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OracleConnector", function () {
  let mockLinkToken;
  let mockOracle;
  let oracleConnector;
  let owner, addr1;
  let jobId;

  beforeEach(async function () {
    // Get signers
    [owner, addr1] = await ethers.getSigners();

    // Deploy MockLinkToken
    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    mockLinkToken = await MockLinkToken.deploy();
    // Wait for deployment
    await mockLinkToken.waitForDeployment();

    // Deploy MockChainlinkOracle
    const MockChainlinkOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockChainlinkOracle.deploy(await mockLinkToken.getAddress());
    // Wait for deployment
    await mockOracle.waitForDeployment();

    // Deploy OracleConnector
    const OracleConnector = await ethers.getContractFactory("OracleConnector");
    oracleConnector = await OracleConnector.deploy(await mockLinkToken.getAddress());
    // Wait for deployment
    await oracleConnector.waitForDeployment();

    // Create a job ID
    jobId = ethers.hexlify(ethers.zeroPadValue("0x7d80a6386ef543a3abb52817f6707e3b", 32));

    // Add oracle to the connector
    await oracleConnector.addOracle(
      await mockOracle.getAddress(),
      "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/",
      jobId
    );

    // Fund the oracle connector with LINK tokens
    await mockLinkToken.transfer(
      await oracleConnector.getAddress(), 
      ethers.parseEther("10")
    );
  });

  it("should request flight data and process oracle response", async function () {
    // Request flight data
    const flightNumber = "SQ100";
    const departureTime = "2025-03-30T15:00:00Z";
    
    const tx = await oracleConnector.requestFlightData(flightNumber, departureTime);
    const receipt = await tx.wait();
    
    // Find the FlightDataRequested event
    const event = receipt.logs.find(
      log => log.fragment && log.fragment.name === "FlightDataRequested"
    );
    
    // Extract the requestId from the event data
    const requestId = event.args[0];
    
    // Check that the request was made
    expect(event.args[1]).to.equal(flightNumber);
    expect(event.args[2]).to.equal(departureTime);
    
    // Simulate oracle response with a 70-minute delay (above threshold)
    const delayMinutes = 70;
    await mockOracle.simulateResponse(
      requestId,
      await oracleConnector.getAddress(),
      oracleConnector.interface.getFunction("fulfillFlightData").selector,
      delayMinutes
    );
    
    // Check the flight status
    const [dataReceived, isDelayed, delayHours] = await oracleConnector.checkFlightStatus(flightNumber, departureTime);
    
    expect(dataReceived).to.be.true;
    expect(isDelayed).to.be.true;
    expect(delayHours).to.equal(1); // 70 minutes = 1 hour
  });

  it("should aggregate multiple oracle responses", async function () {
    // Add a second oracle
    const MockChainlinkOracle = await ethers.getContractFactory("MockOracle");
    const secondOracle = await MockChainlinkOracle.deploy(await mockLinkToken.getAddress());
    await secondOracle.waitForDeployment();
    
    await oracleConnector.addOracle(
      await secondOracle.getAddress(),
      "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/alternative/",
      jobId
    );
    
    // Request flight data
    const flightNumber = "SQ100";
    const departureTime = "2025-03-30T15:00:00Z";
    
    const tx = await oracleConnector.requestFlightData(flightNumber, departureTime);
    const receipt = await tx.wait();
    
    // Find the FlightDataRequested events
    const events = receipt.logs.filter(
      log => log.fragment && log.fragment.name === "FlightDataRequested"
    );
    
    expect(events.length).to.equal(2); // Should have two events for two oracles
    
    // Simulate responses from both oracles with different delays
    // First oracle: 50 minutes delay
    await mockOracle.simulateResponse(
      events[0].args[0], // requestId
      await oracleConnector.getAddress(),
      oracleConnector.interface.getFunction("fulfillFlightData").selector,
      50
    );
    
    // Second oracle: 70 minutes delay
    await secondOracle.simulateResponse(
      events[1].args[0], // requestId
      await oracleConnector.getAddress(),
      oracleConnector.interface.getFunction("fulfillFlightData").selector,
      70
    );
    
    // Check the flight status
    const [dataReceived, isDelayed, delayHours] = await oracleConnector.checkFlightStatus(flightNumber, departureTime);
    
    expect(dataReceived).to.be.true;
    expect(isDelayed).to.be.true; // Average is 60 minutes which equals the threshold
    expect(delayHours).to.equal(1); // 60 minutes = 1 hour
  });
});