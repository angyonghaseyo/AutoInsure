const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insurer Contract - Full Flow", function () {
  let flightPolicy, insurerContract;
  let insurer, user;
  let templateId, activeTemplateId, policyId;

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

  // 2. Create a policy template
  it("should create a policy template", async () => {
    const tx = await insurerContract.createFlightPolicyTemplate(
      "Deactivatable Plan", "Basic delay cover", 1, 2, 1, 5, 2
    );
    await tx.wait();

    const templates = await insurerContract.getAllFlightPolicyTemplates();
    expect(templates.length).to.equal(1);
    expect(templates[0].name).to.equal("Deactivatable Plan");

    templateId = templates[0].templateId;
  });

  // 3. Deactivate a policy template
  it("should deactivate a policy template", async () => {
    await insurerContract.deactivateFlightPolicyTemplate(templateId);
    const template = await insurerContract.getFlightPolicyTemplateById(templateId);
    expect(template.status).to.equal(1); // Deactivated
  });

  // 4. View all policy templates
  it("should return all policy templates", async () => {
    const templates = await insurerContract.getAllFlightPolicyTemplates();
    expect(templates.length).to.be.greaterThan(0);
  });

  // 5. View a policy template by ID
  it("should return the correct template by ID", async () => {
    const template = await insurerContract.getFlightPolicyTemplateById(templateId);
    expect(template.templateId).to.equal(templateId);
    expect(template.name).to.equal("Deactivatable Plan");
  });

  // 6. Attempt to purchase a deactivated policy
  it("should revert purchase for deactivated policy", async () => {
    await expect(insurerContract.connect(user).purchaseFlightPolicy(
      templateId,
      "SQ001", "SIN", "NRT",
      Math.floor(Date.now() / 1000) + 86400,
      { value: ethers.parseEther("1") }
    )).to.be.revertedWith("Policy template is not active");
  });

  // 7. Purchase policy using a new active template
  it("should allow user to purchase a policy", async () => {
    // Create an active template
    await insurerContract.createFlightPolicyTemplate(
      "Active Plan", "Covers delay", 1, 2, 2, 4, 3
    );

    const templates = await insurerContract.getAllFlightPolicyTemplates();
    activeTemplateId = templates[1].templateId;

    const tx = await insurerContract.connect(user).purchaseFlightPolicy(
      activeTemplateId,
      "SQ222", "SIN", "ICN",
      Math.floor(Date.now() / 1000) + 86400,
      { value: ethers.parseEther("1") }
    );
    await tx.wait();
  });

  // 8. Get user policies
  it("should return user’s purchased policies", async () => {
    const userPolicies = await insurerContract.getUserFlightPolicies(user.address);
    expect(userPolicies.length).to.equal(1);
    expect(userPolicies[0].flightNumber).to.equal("SQ222");

    policyId = userPolicies[0].policyId;
  });

  // 9. Get policy with template
  it("should return user policy with template", async () => {
    const [policy, template] = await insurerContract.getFlightPolicyWithTemplate(user.address, policyId);
    expect(policy.flightNumber).to.equal("SQ222");
    expect(template.templateId).to.equal(activeTemplateId);
  });

  // 10. Get active templates
  it("should return only active templates", async () => {
    const activeTemplates = await insurerContract.getActiveFlightPolicyTemplates();
    expect(activeTemplates.length).to.equal(1);
    expect(activeTemplates[0].name).to.equal("Active Plan");
  });

  // 11. isInsurer check
  it("should identify insurer correctly", async () => {
    expect(await insurerContract.isInsurer(insurer.address)).to.equal(true);
    expect(await insurerContract.isInsurer(user.address)).to.equal(false);
  });
});
