const { expect } = require("chai");
const { ethers } = require("hardhat");
const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();

describe("OracleConnector + Listener.js Integration", function () {
  this.timeout(30000); // 30 seconds, enough time for listener + event

  let linkToken, oracleConnector, mockOracle, listenerProcess;

  const FLIGHT_API_URL = "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/SQ100?departure='2025-03-30T15:00:00Z'";
  const JSON_PATH = "delayMinutes";
  const JOB_ID = ethers.encodeBytes32String("mockJobId");
  const EXPECTED_DATA = 120;

  before(async () => {
    const [deployer] = await ethers.getSigners();

    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    linkToken = await MockLinkToken.deploy();
    await linkToken.waitForDeployment();

    const OracleConnector = await ethers.getContractFactory("OracleConnector");
    oracleConnector = await OracleConnector.deploy(await linkToken.getAddress());
    await oracleConnector.waitForDeployment();

    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy(await linkToken.getAddress());
    await mockOracle.waitForDeployment();

    // Fund OracleConnector with LINK tokens
    const fundAmount = ethers.parseEther("1000");
    await linkToken.transfer(await oracleConnector.getAddress(), fundAmount);

    // Add oracle to connector
    await oracleConnector.addOracle(await mockOracle.getAddress(), FLIGHT_API_URL, JOB_ID);

    // ---- Start listener.js in background ----
    const listenerPath = path.resolve(__dirname, "../listener/listener.js");
    listenerProcess = spawn("node", [listenerPath], {
      env: {
        ...process.env,
        RPC_URL: "http://127.0.0.1:8545",
        PRIVATE_KEY:'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        ORACLE_CONTRACT_ADDRESS: await oracleConnector.getAddress()
      }
    });

    listenerProcess.stdout.on("data", (data) => {
      console.log(`[listener] ${data}`);
    });

    listenerProcess.stderr.on("data", (data) => {
      console.error(`[listener ERROR] ${data}`);
    });

    // Give listener time to boot
    await new Promise((res) => setTimeout(res, 3000));
  });

  after(async () => {
    if (listenerProcess) listenerProcess.kill();
  });

  it("should fulfill oracle request with delayMinutes from mock API", async () => {
    const tx = await oracleConnector.requestFlightData(
      FLIGHT_API_URL,
      JSON_PATH
    );

    const receipt = await tx.wait();
    const requestId = receipt.logs[0].args?.requestId || receipt.logs[0].topics?.[1];

    // Wait for listener to pick up and fulfill
    await new Promise((res) => setTimeout(res, 8000));

    const filter = oracleConnector.filters.FlightDataReceived();
    const events = await oracleConnector.queryFilter(filter);
    expect(events.length).to.be.greaterThan(0);

    const data = events[0].args.data;
    expect(Number(data)).to.equal(EXPECTED_DATA);
  });
});