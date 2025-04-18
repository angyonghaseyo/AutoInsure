const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BaggagePolicy", function () {
  let baggagePolicy;
  let oracleConnector;
  let mockLinkToken;
  let insurer;
  let user1;
  let user2;

  // Set up policy templates for testing
  let deactivatedTemplate = {
    templateId: "b95e9e7a-3919-4527-8116-2c91158a0ae7",
    name: "Inactive Baggage Plan",
    description: "Inactive baggage protection plan",
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    premium: ethers.parseEther("0.01"),
    payoutIfDelayed: ethers.parseEther("0.05"),
    payoutIfLost: ethers.parseEther("0.2"),
    maxTotalPayout: ethers.parseEther("0.2"),
    coverageDurationSeconds: 7 * 60 * 60 * 24,
    status: 1, // 0: Active, 1: Deactivated
  };

  let activeTemplate = {
    templateId: "a8e4b1cc-0a5d-4040-b5df-8c5dc0998043",
    name: "Premium Baggage Plan",
    description: "Complete baggage protection for frequent travelers",
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    premium: ethers.parseEther("0.01"),
    payoutIfDelayed: ethers.parseEther("0.05"),
    payoutIfLost: ethers.parseEther("0.2"),
    maxTotalPayout: ethers.parseEther("0.2"),
    coverageDurationSeconds: 7 * 60 * 60 * 24,
    status: 0, // 0: Active, 1: Deactivated
  };

  before(async function () {
    [insurer, user1, user2] = await ethers.getSigners();

    // Deploy mock LINK token
    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    mockLinkToken = await MockLinkToken.deploy();
    await mockLinkToken.waitForDeployment();
    console.log(`MockLinkToken deployed at: ${await mockLinkToken.getAddress()}`);

    // Deploy OracleConnector
    const OracleConnector = await ethers.getContractFactory("OracleConnector");
    oracleConnector = await OracleConnector.deploy(await mockLinkToken.getAddress());
    await oracleConnector.waitForDeployment();
    console.log(`OracleConnector deployed at: ${await oracleConnector.getAddress()}`);

    // Deploy BaggagePolicy contract
    const BaggagePolicyFactory = await ethers.getContractFactory("BaggagePolicy", insurer);
    baggagePolicy = await BaggagePolicyFactory.deploy(await oracleConnector.getAddress());
    await baggagePolicy.waitForDeployment();
    console.log(`BaggagePolicy deployed at: ${await baggagePolicy.getAddress()}`);
  });

  describe("Basic contract setup", function () {
    // 1. Check insurer address
    it("should have the correct insurer address", async function () {
      expect(await baggagePolicy.insurerAddress()).to.equal(insurer.address);
    });

    // 2. Check oracle connector
    it("should have the correct oracle connector", async function () {
      expect(await baggagePolicy.oracleConnector()).to.equal(await oracleConnector.getAddress());
    });
  });

  describe("Policy purchase", function () {
    // 3. Reject deactivated policy purchase
    it("should reject purchase of deactivated policies", async function () {
      await expect(
        baggagePolicy.connect(user1).purchasePolicy(deactivatedTemplate, "Premium leather suitcase and carry-on bag", user1.address, { value: deactivatedTemplate.premium })
      ).to.be.revertedWith("Policy template is not active");
    });

    // 4. Reject purchase with insufficient premium
    it("should reject purchase with insufficient premium", async function () {
      const insufficientAmount = ethers.parseEther("0.005"); // Less than the required premium

      await expect(
        baggagePolicy.connect(user1).purchasePolicy(activeTemplate, "Premium leather suitcase and carry-on bag", user1.address, { value: insufficientAmount })
      ).to.be.revertedWith("Insufficient premium sent");
    });

    // 5. Successfully purchase an active policy
    it("should allow purchase of active policy", async function () {
      const tx = await baggagePolicy.connect(user1).purchasePolicy(activeTemplate, "Premium leather suitcase and carry-on bag", user1.address, { value: activeTemplate.premium });

      await tx.wait();

      const policies = await baggagePolicy.getUserPolicies(user1.address, Math.floor(Date.now() / 1000));
      expect(policies.length).to.equal(1);
      expect(policies[0].itemDescription).to.equal("Premium leather suitcase and carry-on bag");
      expect(policies[0].template.name).to.equal("Premium Baggage Plan");
      expect(policies[0].status).to.equal(0); // Active status
    });

    // 6. Verify policy ID increments correctly
    it("should increment policy ID for each purchase", async function () {
      const firstPolicies = await baggagePolicy.getUserPolicies(user1.address, Math.floor(Date.now() / 1000));
      const firstPolicyId = firstPolicies[0].policyId;

      // Purchase another policy
      await baggagePolicy.connect(user1).purchasePolicy(activeTemplate, "Vintage camera equipment and accessories", user1.address, { value: activeTemplate.premium });

      const updatedPolicies = await baggagePolicy.getUserPolicies(user1.address, Math.floor(Date.now() / 1000));
      expect(updatedPolicies.length).to.equal(2);

      // Fix: Convert both values to BigInt or Number for proper comparison
      const secondPolicyId = updatedPolicies[1].policyId;
      expect(secondPolicyId).to.equal(firstPolicyId + 1n);
    });

    // 7. Verify multiple users can purchase policies
    it("should allow different users to purchase policies", async function () {
      await baggagePolicy.connect(user2).purchasePolicy(activeTemplate, "Surfboard and diving equipment", user2.address, { value: activeTemplate.premium });

      const user2Policies = await baggagePolicy.getUserPolicies(user2.address, Math.floor(Date.now() / 1000));
      expect(user2Policies.length).to.equal(1);
      expect(user2Policies[0].itemDescription).to.equal("Surfboard and diving equipment");
      expect(user2Policies[0].buyer).to.equal(user2.address);
    });
  });

  describe("Policy retrieval", function () {
    // 8. Get policies for a specific user
    it("should get all policies for a given user", async function () {
      const user1Policies = await baggagePolicy.getUserPolicies(user1.address, Math.floor(Date.now() / 1000));
      expect(user1Policies.length).to.equal(2);

      // Verify policy details
      expect(user1Policies[0].buyer).to.equal(user1.address);
      expect(user1Policies[1].buyer).to.equal(user1.address);

      // Different items in the two policies
      const descriptions = user1Policies.map((p) => p.itemDescription);
      expect(descriptions).to.include("Premium leather suitcase and carry-on bag");
      expect(descriptions).to.include("Vintage camera equipment and accessories");
    });

    // 9. Get policies by template ID
    it("should get all policies by template ID", async function () {
      const policiesByTemplate = await baggagePolicy.getUserPoliciesByTemplate(activeTemplate.templateId, Math.floor(Date.now() / 1000));
      expect(policiesByTemplate.length).to.equal(3); // 2 from user1, 1 from user2

      // All should have the same template ID
      for (const policy of policiesByTemplate) {
        expect(policy.template.templateId).to.equal(activeTemplate.templateId);
      }
    });

    // 10. Handle non-existent users correctly
    it("should return empty array for non-existent users", async function () {
      const nonExistentUser = ethers.Wallet.createRandom().address;
      const policies = await baggagePolicy.getUserPolicies(nonExistentUser, Math.floor(Date.now() / 1000));
      expect(policies.length).to.equal(0);
    });
  });

  describe("Policy expiration", function () {
    // 12. Non-insurer access control for expiration
    it("should not allow non-insurer to mark policy as expired", async function () {
      await expect(baggagePolicy.connect(user1).markPolicyAsExpired(0)).to.be.revertedWith("BaggagePolicy: Only the insurer can call this function");
    });

    // 13. Handling non-existent policy IDs
    it("should not allow marking a non-existent policy as expired", async function () {
      const nonExistentPolicyId = 999;
      await expect(baggagePolicy.connect(insurer).markPolicyAsExpired(nonExistentPolicyId)).to.be.revertedWith("Invalid policyId");
    });

    // 14. Prevent premature expiration
    it("should not mark a policy as expired before its expiry date", async function () {
      // Policy was created recently, so it shouldn't be expired yet
      await expect(baggagePolicy.connect(insurer).markPolicyAsExpired(0)).to.be.revertedWith("Policy has not expired yet");
    });

    // 15. Allow expiration after coverage period
    it("should mark a policy as expired after time manipulation", async function () {
      // Get the current policy
      const policies = await baggagePolicy.getUserPolicies(user1.address, Math.floor(Date.now() / 1000));
      const policy = policies[0];

      // Advance time by policy duration + 1 day
      // Fix: Make sure we're using proper BigInt math
      const advanceTime = BigInt(policy.template.coverageDurationSeconds) + 1n;
      await ethers.provider.send("evm_increaseTime", [Number(advanceTime)]);
      await ethers.provider.send("evm_mine");

      // Now we should be able to mark as expired
      await baggagePolicy.connect(insurer).markPolicyAsExpired(0);

      // Verify the policy is marked as expired
      const updatedPolicies = await baggagePolicy.getUserPolicies(user1.address, Math.floor(Date.now() / 1000));
      expect(updatedPolicies[0].status).to.equal(1); // Expired status
    });

    // 16. Prevent double expiration
    it("should not mark an already expired policy as expired again", async function () {
      // Fix: Corrected the expected error message based on the actual contract behavior
      await expect(baggagePolicy.connect(insurer).markPolicyAsExpired(0)).to.be.revertedWith("Policy is not active");
    });
  });
});
