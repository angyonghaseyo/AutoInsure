const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insurer Contract - Full Flow", function () {
  let flightPolicy, baggagePolicy, insurerContract;
  let oracleConnector, mockLinkToken;
  let insurer, user;
  let policyId;
  let currentBlockTimestamp;
  let initialDeposit = ethers.parseEther("10");
  let deactivatedTemplate = {
    templateId: "795e9e7a-3919-4527-8116-2c91158a0ae7",
    name: "Inactive Plan",
    description: "Inactive",
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    premium: ethers.parseEther("1"),
    payoutPerHour: ethers.parseEther("1"),
    delayThresholdHours: 1,
    maxTotalPayout: ethers.parseEther("3"),
    coverageDurationSeconds: 1 * 24 * 60 * 60,
    status: 1, // 0: Active, 1: Inactive
  };

  let activeTemplate = {
    templateId: "8ae4b1cc-0a5d-4040-b5df-8c5dc0998043",
    name: "Active Plan",
    description: "Active",
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    premium: ethers.parseEther("1"),
    payoutPerHour: ethers.parseEther("2"),
    delayThresholdHours: 2,
    maxTotalPayout: ethers.parseEther("4"),
    coverageDurationSeconds: 3 * 24 * 60 * 60,
    status: 0, // 0: Active, 1: Inactive
  };

  let expensiveTemplate = {
    templateId: "8ae4b1cc-0a5d-4040-b5df-8c5dc0998043",
    name: "Active Plan",
    description: "Active",
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    premium: ethers.parseEther("1"),
    payoutPerHour: ethers.parseEther("2"),
    delayThresholdHours: 2,
    maxTotalPayout: ethers.parseEther("1000"),
    coverageDurationSeconds: 3 * 24 * 60 * 60,
    status: 0, // 0: Active, 1: Inactive
  };

  before(async () => {
    [insurer, user] = await ethers.getSigners();

    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    mockLinkToken = await MockLinkToken.deploy();
    await mockLinkToken.waitForDeployment();
    console.log(`MockLinkToken deployed at: ${await mockLinkToken.getAddress()}`);

    const OracleConnector = await ethers.getContractFactory("OracleConnector");
    oracleConnector = await OracleConnector.deploy(await mockLinkToken.getAddress());
    await oracleConnector.waitForDeployment();
    console.log(`OracleConnector deployed at: ${await oracleConnector.getAddress()}`);

    const FlightPolicy = await ethers.getContractFactory("FlightPolicy", insurer);
    flightPolicy = await FlightPolicy.deploy(await oracleConnector.getAddress());
    await flightPolicy.waitForDeployment();

    const BaggagePolicy = await ethers.getContractFactory("BaggagePolicy", insurer);
    baggagePolicy = await BaggagePolicy.deploy(await oracleConnector.getAddress());
    await baggagePolicy.waitForDeployment();

    const Insurer = await ethers.getContractFactory("Insurer", insurer);
    insurerContract = await Insurer.deploy(await flightPolicy.getAddress(), await baggagePolicy.getAddress());
    await insurerContract.waitForDeployment();

    // Get the current block timestamp
    const latestBlock = await ethers.provider.getBlock("latest");
    currentBlockTimestamp = latestBlock.timestamp;

    insurerContract.deposit({ value: initialDeposit });
  });

  // 1. Check insurer address
  it("should deploy with correct insurer address", async () => {
    expect(await insurerContract.insurerAddress()).to.equal(insurer.address);
    expect(await insurerContract.flightPolicy()).to.equal(await flightPolicy.getAddress());
  });

  // 2. Attempt to purchase a deactivated policy
  it("should revert purchase for deactivated policy", async () => {
    // Use the blockchain timestamp + future offset
    const futureDepartureTime = currentBlockTimestamp + 604800; // One week in the future

    await expect(
      insurerContract.connect(user).purchaseFlightPolicy(deactivatedTemplate, "SQ001", futureDepartureTime, Math.floor(Date.now() / 1000), { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Policy template is not active");
  });

  // 3. Attempt to purchase a policy that exceeds total possible payout
  it("should revert purchase for policy that exceed total possible payout", async () => {
    await expect(
      insurerContract
        .connect(user)
        .purchaseFlightPolicy(expensiveTemplate, "SQ222", Math.floor(Date.now() / 1000) + 86400, Math.floor(Date.now() / 1000), { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Insufficient contract balance to cover potential payouts");
  });

  // 4. Reject purchase with insufficient premium
  it("should reject purchase with insufficient premium", async function () {
    const futureDepartureTime = currentBlockTimestamp + 604800;
    const insufficientAmount = ethers.parseEther("0.005"); // Less than the required premium

    await expect(
      insurerContract.connect(user).purchaseFlightPolicy(activeTemplate, "SQ222", futureDepartureTime, Math.floor(Date.now() / 1000), { value: insufficientAmount })
    ).to.be.revertedWith("Insufficient premium sent");
  });

  // 3. Purchase policy using a new active template
  it("should allow user to purchase a policy", async () => {
    // Use the blockchain timestamp + future offset
    const futureDepartureTime = currentBlockTimestamp + 604800; // One week in the future

    const tx = await insurerContract
      .connect(user)
      .purchaseFlightPolicy(activeTemplate, "SQ222", futureDepartureTime, Math.floor(Date.now() / 1000), { value: ethers.parseEther("1") });
    await tx.wait();
  });

  // 4. Get user policies by template
  it("should return only policies for a given template", async function () {
    const policiesTemplate1 = await flightPolicy.getUserPoliciesByTemplate(activeTemplate.templateId, Math.floor(Date.now() / 1000));
    expect(policiesTemplate1.length).to.equal(1);
    const flightNumbersTemplate1 = policiesTemplate1.map((policy) => policy.flightNumber);
    expect(flightNumbersTemplate1).to.include("SQ222");

    const policiesTemplate2 = await flightPolicy.getUserPoliciesByTemplate(deactivatedTemplate.templateId, Math.floor(Date.now() / 1000));
    expect(policiesTemplate2.length).to.equal(0);
  });

  // 5. Get user policies
  it("should return user's purchased policies", async () => {
    const userPolicies = await insurerContract.getUserFlightPolicies(user.address, Math.floor(Date.now() / 1000));
    expect(userPolicies.length).to.equal(1);
    expect(userPolicies[0].flightNumber).to.equal("SQ222");

    policyId = userPolicies[0].policyId;
  });

  // 6. isInsurer check
  it("should identify insurer correctly", async () => {
    expect(await insurerContract.isInsurer(insurer.address)).to.equal(true);
    expect(await insurerContract.isInsurer(user.address)).to.equal(false);
  });

  // 8. Test isFlightPolicyTemplateAllowedForPurchase
  it("should correctly indicate whether flight policies are allowed for purchase", async function () {
    const templates = [activeTemplate, expensiveTemplate];
    const allowed = await insurerContract.isFlightPolicyTemplateAllowedForPurchase(templates, currentBlockTimestamp);
    expect(allowed[0]).to.be.true;
    expect(allowed[1]).to.be.false;
  });

  describe("Deposit", function () {
    it("should allow the insurer to deposit funds and update contract balance", async function () {
      const depositAmount = ethers.parseEther("1.0");

      await expect(insurerContract.deposit({ value: depositAmount }))
        .to.emit(insurerContract, "FundsDeposited")
        .withArgs(insurer, depositAmount);

      const contractBalance = await insurerContract.getContractBalance();
      expect(contractBalance).to.equal(depositAmount + initialDeposit + activeTemplate.premium);
    });

    it("should revert when deposit amount is zero", async function () {
      await expect(insurerContract.deposit({ value: 0 })).to.be.revertedWith("Insurer: Must deposit a positive amount");
    });

    it("should not allow non-insurer to deposit", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await expect(insurerContract.connect(user).deposit({ value: depositAmount })).to.be.revertedWith("Insurer: Only the insurer can call this");
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("2.0");
      await insurerContract.deposit({ value: depositAmount });
    });

    it("should allow the insurer to withdraw funds and update contract balance", async function () {
      const withdrawAmount = ethers.parseEther("1.0");

      await expect(insurerContract.withdraw(withdrawAmount)).to.emit(insurerContract, "FundsWithdrawn").withArgs(insurer, withdrawAmount);

      const contractBalance = await insurerContract.getContractBalance();
      expect(contractBalance).to.equal(ethers.parseEther("2.0") + initialDeposit + activeTemplate.premium);
    });

    it("should revert when withdrawing more than the contract balance", async function () {
      const withdrawAmount = ethers.parseEther("100.0");
      await expect(insurerContract.withdraw(withdrawAmount)).to.be.revertedWith("Insufficient balance");
    });

    it("should not allow non-insurer to withdraw", async function () {
      const withdrawAmount = ethers.parseEther("1.0");
      await expect(insurerContract.connect(user).withdraw(withdrawAmount)).to.be.revertedWith("Insurer: Only the insurer can call this");
    });
  });

  describe("Get Contract Balance", function () {
    it("should return the correct contract balance after deposits", async function () {
      const contractBalance = await insurerContract.getContractBalance();
      expect(contractBalance).to.equal(ethers.parseEther("6.0") + initialDeposit + activeTemplate.premium);
    });
  });
});
