const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlightInsurance", function () {
  let flightInsurance;
  let oracleConnector;
  let owner;
  let user1;
  let user2;
  
  const flightNumber = "AA123";
  const premiumAmount = ethers.parseEther("0.02");
  
  beforeEach(async function () {
    // Get the signers
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy the OracleConnector contract
    const OracleConnector = await ethers.getContractFactory("OracleConnector");
    oracleConnector = await OracleConnector.deploy();
    await oracleConnector.waitForDeployment();
    
    // Deploy the FlightInsurance contract
    const FlightInsurance = await ethers.getContractFactory("FlightInsurance");
    flightInsurance = await FlightInsurance.deploy(await oracleConnector.getAddress());
    await flightInsurance.waitForDeployment();
  });

  describe("Policy Purchase", function () {
    it("Should allow a user to purchase a policy", async function () {
      // Set departure time to 1 day in the future
      const departureTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      
      // Purchase a policy
      await expect(
        flightInsurance.connect(user1).purchasePolicy(flightNumber, departureTime, {
          value: premiumAmount
        })
      )
        .to.emit(flightInsurance, "PolicyPurchased")
        .withArgs(1, user1.address, flightNumber, departureTime);
      
      // Check policy details
      const policy = await flightInsurance.getPolicyDetails(1);
      expect(policy.policyId).to.equal(1);
      expect(policy.policyholder).to.equal(user1.address);
      expect(policy.flightNumber).to.equal(flightNumber);
      expect(policy.departureTime).to.equal(departureTime);
      expect(policy.premium).to.equal(premiumAmount);
      expect(policy.isPaid).to.equal(false);
      expect(policy.isClaimed).to.equal(false);
      expect(policy.status).to.equal(0); // Active status
    });

    it("Should reject policy purchase with insufficient premium", async function () {
      const departureTime = Math.floor(Date.now() / 1000) + 86400;
      const lowPremium = ethers.parseEther("0.005"); // Less than minimum
      
      await expect(
        flightInsurance.connect(user1).purchasePolicy(flightNumber, departureTime, {
          value: lowPremium
        })
      ).to.be.revertedWith("Premium too low");
    });

    it("Should reject policy for past flights", async function () {
      const pastDepartureTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      await expect(
        flightInsurance.connect(user1).purchasePolicy(flightNumber, pastDepartureTime, {
          value: premiumAmount
        })
      ).to.be.revertedWith("Departure time must be in the future");
    });
  });

  describe("Policy Management", function () {
    let policyId;
    let departureTime;
    
    beforeEach(async function () {
      // Create a policy for testing
      departureTime = Math.floor(Date.now() / 1000) + 86400;
      const tx = await flightInsurance.connect(user1).purchasePolicy(flightNumber, departureTime, {
        value: premiumAmount
      });
      const receipt = await tx.wait();
      
      // Find the PolicyPurchased event and extract the policyId
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "PolicyPurchased"
      );
      policyId = event.args[0];
    });

    it("Should allow the policyholder to cancel a policy", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      // Cancel the policy
      const tx = await flightInsurance.connect(user1).cancelPolicy(policyId);
      const receipt = await tx.wait();
      
      // Calculate gas cost
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      // Check refund (50% of premium)
      const expectedRefund = premiumAmount / 2n;
      const newBalance = await ethers.provider.getBalance(user1.address);
      
      // Account for gas costs in the balance check
      expect(newBalance).to.be.closeTo(
        initialBalance + expectedRefund - gasCost,
        ethers.parseEther("0.0001") // Allow for small rounding errors
      );
      
      // Check policy status
      const policy = await flightInsurance.getPolicyDetails(policyId);
      expect(policy.status).to.equal(3); // Cancelled status
    });

    it("Should not allow non-policyholders to cancel a policy", async function () {
      await expect(
        flightInsurance.connect(user2).cancelPolicy(policyId)
      ).to.be.revertedWith("Not the policyholder");
    });

    it("Should list all policies purchased by a user", async function () {
      // Purchase another policy
      await flightInsurance.connect(user1).purchasePolicy(
        "BA456", 
        Math.floor(Date.now() / 1000) + 172800, // 2 days from now
        { value: premiumAmount }
      );
      
      // Get user policies
      const userPolicies = await flightInsurance.getPoliciesByUser(user1.address);
      expect(userPolicies.length).to.equal(2);
      expect(userPolicies[0]).to.equal(1);
      expect(userPolicies[1]).to.equal(2);
    });
  });

  describe("Oracle Integration", function () {
    let policyId;
    let departureTime;
    
    beforeEach(async function () {
      // Create a policy for testing
      departureTime = Math.floor(Date.now() / 1000) + 86400;
      const tx = await flightInsurance.connect(user1).purchasePolicy(flightNumber, departureTime, {
        value: premiumAmount
      });
      const receipt = await tx.wait();
      
      // Find the PolicyPurchased event and extract the policyId
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "PolicyPurchased"
      );
      policyId = event.args[0];
    });

    it("Should handle flight status requests", async function () {
      // Mock the oracle response (this is simplified for testing)
      // In a real environment, we'd need to simulate the Chainlink request/response cycle
      
      // Get the flight status (this will make a request to the oracle)
      const result = await oracleConnector.getFlightStatus(flightNumber, departureTime);
      
      // Since our mock will return default values, we just check the function doesn't revert
      expect(result[0]).to.equal(false); // isDelayed
      expect(result[1]).to.equal(0);     // delayMinutes
    });
  });

  describe("Contract Management", function () {
    it("Should allow owner to update delay threshold", async function () {
      const newThreshold = 180; // 3 hours
      
      await expect(flightInsurance.connect(owner).updateDelayThreshold(newThreshold))
        .to.emit(flightInsurance, "DelayThresholdUpdated")
        .withArgs(newThreshold);
        
      expect(await flightInsurance.defaultDelayThreshold()).to.equal(newThreshold * 60); // Convert to seconds
    });

    it("Should not allow non-owners to update delay threshold", async function () {
      await expect(
        flightInsurance.connect(user1).updateDelayThreshold(180)
      ).to.be.reverted; // Exact error depends on how Ownable is implemented
    });

    it("Should allow owner to withdraw funds", async function () {
      // First, add some funds by purchasing policies
      const departureTime = Math.floor(Date.now() / 1000) + 86400;
      await flightInsurance.connect(user1).purchasePolicy(flightNumber, departureTime, {
        value: premiumAmount
      });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await flightInsurance.getAddress());
      
      // Withdraw all funds
      const tx = await flightInsurance.connect(owner).withdrawFunds(contractBalance);
      const receipt = await tx.wait();
      
      // Calculate gas cost
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      // Check if funds were received
      const newBalance = await ethers.provider.getBalance(owner.address);
      expect(newBalance).to.be.closeTo(
        initialBalance + contractBalance - gasCost,
        ethers.parseEther("0.0001")
      );
      
      // Check contract balance
      const newContractBalance = await ethers.provider.getBalance(await flightInsurance.getAddress());
      expect(newContractBalance).to.equal(0);
    });
  });
});