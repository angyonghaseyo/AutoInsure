const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlightPolicy", function () {
  let flightPolicy;
  let insurer;
  let user1;
  let user2;
  let oracleConnector;
  let mockLinkToken;
  let policyId = 0;
  let currentBlockTimestamp;

  // Templates for testing
  let deactivatedTemplate = {
    templateId: "795e9e7a-3919-4527-8116-2c91158a0ae7",
    name: "Inactive Plan",
    description: "Inactive",
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    premium: 1,
    payoutPerHour: 1,
    delayThresholdHours: 1,
    maxTotalPayout: 3,
    coverageDurationSeconds: 1 * 24 * 60 * 60,
    status: 1, // 0: Active, 1: Inactive
  };

  let activeTemplate = {
    templateId: "8ae4b1cc-0a5d-4040-b5df-8c5dc0998043",
    name: "Active Plan",
    description: "Active",
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    premium: 1,
    payoutPerHour: 1,
    delayThresholdHours: 1,
    maxTotalPayout: 3,
    coverageDurationSeconds: 1 * 24 * 60 * 60,
    status: 0, // 0: Active, 1: Inactive
  };

  before(async function () {
    [insurer, user1, user2] = await ethers.getSigners();

    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    mockLinkToken = await MockLinkToken.deploy();
    await mockLinkToken.waitForDeployment();
    console.log(`MockLinkToken deployed at: ${await mockLinkToken.getAddress()}`);

    const OracleConnector = await ethers.getContractFactory("OracleConnector");
    oracleConnector = await OracleConnector.deploy(await mockLinkToken.getAddress());
    await oracleConnector.waitForDeployment();
    console.log(`OracleConnector deployed at: ${await oracleConnector.getAddress()}`);

    const FlightPolicyFactory = await ethers.getContractFactory("FlightPolicy", insurer);
    flightPolicy = await FlightPolicyFactory.deploy(await oracleConnector.getAddress());
    await flightPolicy.waitForDeployment();

    // Get the current block timestamp
    const latestBlock = await ethers.provider.getBlock("latest");
    currentBlockTimestamp = latestBlock.timestamp;
  });

  // 1. Check insurer address
  it("should deploy with correct insurer address", async function () {
    expect(await flightPolicy.insurerAddress()).to.equal(insurer.address);
  });

  // 2. Attempt to purchase a deactivated policy
  it("should not allow purchase of deactivated policy", async function () {
    // Use the blockchain timestamp + future offset
    const futureDepartureTime = currentBlockTimestamp + 604800; // One week in the future

    await expect(flightPolicy.connect(user1).purchasePolicy(deactivatedTemplate, "SQ101", futureDepartureTime, user1.address)).to.be.revertedWith("Policy template is not active");
  });

  // 3. Purchase policy (create new template in same test)
  it("should allow user to purchase a new policy", async function () {
    // Use the blockchain timestamp + future offset
    const futureDepartureTime = currentBlockTimestamp + 604800; // One week in the future

    const tx = await flightPolicy.connect(user1).purchasePolicy(activeTemplate, "SQ222", futureDepartureTime, user1.address);
    await tx.wait();

    const policies = await flightPolicy.getUserPolicies(user1.address, Math.floor(Date.now() / 1000));
    expect(policies.length).to.equal(1);
    expect(policies[0].flightNumber).to.equal("SQ222");
    policyId = policies[0].policyId;
  });

  // 4. Get user policies
  it("should return all user policies", async function () {
    const user1Ppolicies = await flightPolicy.getUserPolicies(user1.address, Math.floor(Date.now() / 1000));
    expect(user1Ppolicies.length).to.equal(1);
    expect(user1Ppolicies[0].flightNumber).to.equal("SQ222");
    policyId = user1Ppolicies[0].policyId;

    const user2Ppolicies = await flightPolicy.getUserPolicies(user2.address, Math.floor(Date.now() / 1000));
    expect(user2Ppolicies.length).to.equal(0);
  });

  // 5. Get user policies by template
  it("should return only policies for a given template", async function () {
    const policiesTemplate1 = await flightPolicy.getUserPoliciesByTemplate(activeTemplate.templateId, Math.floor(Date.now() / 1000));
    expect(policiesTemplate1.length).to.equal(1);
    const flightNumbersTemplate1 = policiesTemplate1.map((policy) => policy.flightNumber);
    expect(flightNumbersTemplate1).to.include("SQ222");

    const policiesTemplate2 = await flightPolicy.getUserPoliciesByTemplate(deactivatedTemplate.templateId, Math.floor(Date.now() / 1000));
    expect(policiesTemplate2.length).to.equal(0);
  });
});
