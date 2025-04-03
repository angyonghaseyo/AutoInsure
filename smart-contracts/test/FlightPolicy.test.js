const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlightPolicy", function () {
  let flightPolicy;
  let insurer;
  let user1;
  let templateId = 0;
  let policyId = 0;

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

  // 2. Create a policy template
  it("should create a policy template", async function () {
    const tx = await flightPolicy.createPolicyTemplate(
      "Basic Cover",
      "Protects against delays",
      1, // premium
      1, // payoutPerHour
      1, // delayThreshold
      3, // maxPayout
      2 // coverageDuration
    );
    await tx.wait();

    const templates = await flightPolicy.getAllPolicyTemplates();
    expect(templates.length).to.equal(1);
    expect(templates[0].name).to.equal("Basic Cover");
    templateId = templates[0].templateId;
  });

  // 3. Deactivate a policy template
  it("should deactivate a policy template", async function () {
    await flightPolicy.deactivatePolicyTemplate(templateId);
    const templates = await flightPolicy.getAllPolicyTemplates();
    expect(templates[0].status).to.equal(1); // Deactivated
  });

  // 4. View all policy templates
  it("should return all policy templates", async function () {
    const all = await flightPolicy.getAllPolicyTemplates();
    expect(all.length).to.equal(1);
    expect(all[0].name).to.equal("Basic Cover");
  });

  // 5. View policy template by ID
  it("should return policy template by ID", async function () {
    const template = await flightPolicy.getPolicyTemplateById(templateId);
    expect(template.name).to.equal("Basic Cover");
  });

  // 6. Attempt to purchase a deactivated policy
  it("should not allow purchase of deactivated policy", async function () {
    await expect(
      flightPolicy.connect(user1).purchasePolicy(templateId, "SQ101", "SIN", "NRT", Math.floor(Date.now() / 1000) + 3600, user1.address, { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Policy template is not active");
  });

  // 7. Purchase policy (create new template in same test)
  it("should allow user to purchase a new policy", async function () {
    await flightPolicy.createPolicyTemplate("Active Plan", "Active", 1, 1, 1, 3, 1);
    const newTemplateId = 1;

    const tx = await flightPolicy
      .connect(user1)
      .purchasePolicy(newTemplateId, "SQ222", "SIN", "LAX", Math.floor(Date.now() / 1000) + 3600, user1.address, { value: ethers.parseEther("1") });
    await tx.wait();

    const policies = await flightPolicy.getUserPolicies(user1.address);
    expect(policies.length).to.equal(1);
    expect(policies[0].flightNumber).to.equal("SQ222");
    policyId = policies[0].policyId;
  });

  // 8. Get user policies
  it("should return all user policies", async function () {
    const userPolicies = await flightPolicy.getUserPolicies(user1.address);
    expect(userPolicies.length).to.equal(1);
    expect(userPolicies[0].departureAirportCode).to.equal("SIN");
  });

  // 9. Get user policy with template
  it("should return user policy with template", async function () {
    const [policy, template] = await flightPolicy.getUserPolicyWithTemplate(user1.address, policyId);
    expect(policy.flightNumber).to.equal("SQ222");
    expect(template.name).to.equal("Active Plan");
  });

  // 10. Get active policy templates
  it("should return only active policy templates", async function () {
    const activeTemplates = await flightPolicy.getActivePolicyTemplates();
    expect(activeTemplates.length).to.equal(1);
    expect(activeTemplates[0].status).to.equal(0); // Active
    expect(activeTemplates[0].name).to.equal("Active Plan");
  });

  // 11. Get user policies by template
  it("should return only policies for a given template", async function () {
    const policiesTemplate1 = await flightPolicy.getUserPoliciesByTemplate(1);
    expect(policiesTemplate1.length).to.equal(1);
    const flightNumbersTemplate1 = policiesTemplate1.map((policy) => policy.flightNumber);
    expect(flightNumbersTemplate1).to.include("SQ222");

    const policiesTemplate2 = await flightPolicy.getUserPoliciesByTemplate(2);
    expect(policiesTemplate2.length).to.equal(0);
  });
});
