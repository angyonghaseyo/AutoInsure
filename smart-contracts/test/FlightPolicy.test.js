const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlightPolicy", function () {
  let flightPolicy;
  let insurer;
  let user1;
  let policyId = 0;
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
    coverageDurationDays: 1,
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
    coverageDurationDays: 1,
    status: 0, // 0: Active, 1: Inactive
  };

  before(async function () {
    [insurer, user1] = await ethers.getSigners();
    const FlightPolicyFactory = await ethers.getContractFactory("FlightPolicy", insurer);
    flightPolicy = await FlightPolicyFactory.deploy();
    await flightPolicy.waitForDeployment();
  });

  // 1. Check insurer address
  it("should deploy with correct insurer address", async function () {
    expect(await flightPolicy.insurerAddress()).to.equal(insurer.address);
  });

  // 2. Attempt to purchase a deactivated policy
  it("should not allow purchase of deactivated policy", async function () {
    await expect(
      flightPolicy.connect(user1).purchasePolicy(deactivatedTemplate, "SQ101", "SIN", "NRT", Math.floor(Date.now() / 1000) + 3600, user1.address, { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Policy template is not active");
  });

  // 3. Purchase policy (create new template in same test)
  it("should allow user to purchase a new policy", async function () {
    const tx = await flightPolicy
      .connect(user1)
      .purchasePolicy(activeTemplate, "SQ222", "SIN", "LAX", Math.floor(Date.now() / 1000) + 3600, user1.address, { value: ethers.parseEther("1") });
    await tx.wait();

    const policies = await flightPolicy.getUserPolicies(user1.address);
    expect(policies.length).to.equal(1);
    expect(policies[0].flightNumber).to.equal("SQ222");
    policyId = policies[0].policyId;
  });

  // 4. Get user policies
  it("should return all user policies", async function () {
    const userPolicies = await flightPolicy.getUserPolicies(user1.address);
    expect(userPolicies.length).to.equal(1);
    expect(userPolicies[0].departureAirportCode).to.equal("SIN");
  });

  // 5. Get user policy with template
  it("should return user policy with template", async function () {
    const [policy, template] = await flightPolicy.getUserPolicyWithTemplate(user1.address, policyId);
    expect(policy.flightNumber).to.equal("SQ222");
    expect(template.name).to.equal("Active Plan");
  });

  // 11. Get user policies by template
  it("should return only policies for a given template", async function () {
    const policiesTemplate1 = await flightPolicy.getUserPoliciesByTemplate(activeTemplate.templateId);
    expect(policiesTemplate1.length).to.equal(1);
    const flightNumbersTemplate1 = policiesTemplate1.map((policy) => policy.flightNumber);
    expect(flightNumbersTemplate1).to.include("SQ222");

    const policiesTemplate2 = await flightPolicy.getUserPoliciesByTemplate(deactivatedTemplate.templateId);
    expect(policiesTemplate2.length).to.equal(0);
  });
});
