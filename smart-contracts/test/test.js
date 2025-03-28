const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insurer Contract", function () {
  let Insurer, insurer, Policy, policy;
  let owner, player1, player2;

  before(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy Insurer contract
    Insurer = await ethers.getContractFactory("Insurer");
    insurer = await Insurer.connect(owner).deploy(owner);
    await insurer.waitForDeployment();

    // Fund insurer contract for payouts
    await owner.sendTransaction({
      to: await insurer.getAddress(),
      value: ethers.parseEther("50"),
    });
  });

  it("should only allow the company (owner) to add policies", async () => {
    await expect(insurer.connect(player1).addPolicy(1, 5, 10, 2, 30)).to.be.revertedWith("Insurer, Only the owner can call this function");

    await expect(insurer.connect(owner).addPolicy(1, 5, 10, 2, 30)).to.emit(insurer, "PolicyAdded").withArgs(1);
  });

  it("should allow users to buy a policy", async () => {
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

    await expect(insurer.connect(player1).buyPolicy(1, "SQ001", currentTimestamp + 86400, { value: ethers.parseEther("1") }))
      .to.emit(insurer, "PolicyBought")
      .withArgs(1);

    await expect(insurer.connect(player2).buyPolicy(1, "SQ002", currentTimestamp + 172800, { value: ethers.parseEther("1") }))
      .to.emit(insurer, "PolicyBought")
      .withArgs(1);
  });

  it("should allow a policyholder to claim a policy", async () => {
    // Simulate a delay payout (assuming oracle updates flight delay)
    // Assume a payout of 5 ETH
    const payoutAmount = ethers.parseEther("5");

    // Before claim
    let player1BalanceBefore = await ethers.provider.getBalance(player1.address);

    // Claim policy
    await expect(insurer.connect(player1).claimPolicy()).to.emit(insurer, "Payout").withArgs(payoutAmount, player1.address);

    // After claim
    let player1BalanceAfter = await ethers.provider.getBalance(player1.address);

    expect(player1BalanceAfter).to.be.closeTo(player1BalanceBefore + payoutAmount, ethers.parseEther("0.01"));

    // Ensure policy cannot be claimed twice
    await expect(insurer.connect(player1).claimPolicy()).to.be.revertedWith("Policy has been claimed or has expired");
  });

  it("should allow only the owner to delete a policy", async () => {
    await expect(insurer.connect(player1).deletePolicy(1)).to.be.revertedWith("Insurer, Only the owner can call this function");

    await expect(insurer.connect(owner).deletePolicy(1)).to.emit(insurer, "PolicyDeleted").withArgs(1);
  });

  it("should allow the owner to withdraw funds", async () => {
    const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

    await expect(insurer.connect(player1).withdrawFunds(10)).to.be.revertedWith("Insurer, Only the owner can call this function");

    await expect(insurer.connect(owner).withdrawFunds(10)).to.changeEtherBalance(owner, ethers.parseEther("10"));

    const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
    expect(finalOwnerBalance).to.be.greaterThan(initialOwnerBalance);
  });
});
