const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insurer Contract - Full Flow", function () {
  let flightPolicy, insurerContract;
  let insurer, user;
  let policyId;
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
    payoutPerHour: 2,
    delayThresholdHours: 2,
    maxTotalPayout: 4,
    coverageDurationDays: 3,
    status: 0, // 0: Active, 1: Inactive
  };

  before(async () => {
    [insurer, user] = await ethers.getSigners();

    const FlightPolicy = await ethers.getContractFactory("FlightPolicy", insurer);
    flightPolicy = await FlightPolicy.deploy();
    await flightPolicy.waitForDeployment();

    const Insurer = await ethers.getContractFactory("Insurer", insurer);
    insurerContract = await Insurer.deploy(await flightPolicy.getAddress());
    await insurerContract.waitForDeployment();
  });

  // 1. Check insurer address
  it("should deploy with correct insurer address", async () => {
    expect(await insurerContract.insurerAddress()).to.equal(insurer.address);
    expect(await insurerContract.flightPolicy()).to.equal(await flightPolicy.getAddress());
  });

  // 2. Attempt to purchase a deactivated policy
  it("should revert purchase for deactivated policy", async () => {
    await expect(
      insurerContract.connect(user).purchaseFlightPolicy(deactivatedTemplate, "SQ001", "SIN", "NRT", Math.floor(Date.now() / 1000) + 86400, { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Policy template is not active");
  });

  // 3. Purchase policy using a new active template
  it("should allow user to purchase a policy", async () => {
    const tx = await insurerContract
      .connect(user)
      .purchaseFlightPolicy(activeTemplate, "SQ222", "SIN", "ICN", Math.floor(Date.now() / 1000) + 86400, { value: ethers.parseEther("1") });
    await tx.wait();
  });

  // 4. Get user policies by template
  it("should return only policies for a given template", async function () {
    const policiesTemplate1 = await flightPolicy.getUserPoliciesByTemplate(activeTemplate.templateId);
    expect(policiesTemplate1.length).to.equal(1);
    const flightNumbersTemplate1 = policiesTemplate1.map((policy) => policy.flightNumber);
    expect(flightNumbersTemplate1).to.include("SQ222");

    const policiesTemplate2 = await flightPolicy.getUserPoliciesByTemplate(deactivatedTemplate.templateId);
    expect(policiesTemplate2.length).to.equal(0);
  });

  // 5. Get user policies
  it("should return user’s purchased policies", async () => {
    const userPolicies = await insurerContract.getUserFlightPolicies(user.address);
    expect(userPolicies.length).to.equal(1);
    expect(userPolicies[0].flightNumber).to.equal("SQ222");

    policyId = userPolicies[0].policyId;
  });

  // 6. Get policy with template
  it("should return user policy with template", async () => {
    const [policy, template] = await insurerContract.getFlightPolicyWithTemplate(user.address, policyId);
    expect(policy.flightNumber).to.equal("SQ222");
    expect(template.templateId).to.equal(activeTemplate.templateId);
  });

  // 7. isInsurer check
  it("should identify insurer correctly", async () => {
    expect(await insurerContract.isInsurer(insurer.address)).to.equal(true);
    expect(await insurerContract.isInsurer(user.address)).to.equal(false);
  });
});
