const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const networkName = hre.network.name;
  console.log(`Network: ${networkName}`);

  // Load deployment data
  let deploymentData;
  try {
    deploymentData = JSON.parse(
      fs.readFileSync(`deployment-${networkName}.json`, "utf8")
    );
  } catch (error) {
    console.error(`No deployment found for network ${networkName}`);
    console.error("Please run deploy.js first");
    process.exit(1);
  }

  const flightInsuranceAddress = deploymentData.flightInsurance;
  const oracleConnectorAddress = deploymentData.oracleConnector;

  console.log(`FlightInsurance address: ${flightInsuranceAddress}`);
  console.log(`OracleConnector address: ${oracleConnectorAddress}`);

  // Get contract instances
  const FlightInsurance = await hre.ethers.getContractFactory("FlightInsurance");
  const flightInsurance = FlightInsurance.attach(flightInsuranceAddress);

  const OracleConnector = await hre.ethers.getContractFactory("OracleConnector");
  const oracleConnector = OracleConnector.attach(oracleConnectorAddress);

  // Get signer
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Interacting with contracts as: ${deployer.address}`);

  // Menu of actions
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const menu = async () => {
    console.log("\n--- Flight Insurance Interaction ---");
    console.log("1. Display contract info");
    console.log("2. Purchase a policy");
    console.log("3. Get policy details");
    console.log("4. List my policies");
    console.log("5. Cancel policy");
    console.log("6. Claim policy");
    console.log("7. Update delay threshold (owner only)");
    console.log("8. Withdraw funds (owner only)");
    console.log("9. Exit");

    readline.question("Select an option: ", async (option) => {
      switch (option) {
        case "1":
          await displayContractInfo();
          break;
        case "2":
          await purchasePolicy();
          break;
        case "3":
          await getPolicyDetails();
          break;
        case "4":
          await listMyPolicies();
          break;
        case "5":
          await cancelPolicy();
          break;
        case "6":
          await claimPolicy();
          break;
        case "7":
          await updateDelayThreshold();
          break;
        case "8":
          await withdrawFunds();
          break;
        case "9":
          console.log("Exiting...");
          readline.close();
          process.exit(0);
          break;
        default:
          console.log("Invalid option, please try again");
          await menu();
      }
    });
  };

  // Option 1: Display contract info
  const displayContractInfo = async () => {
    try {
      const minPremium = await flightInsurance.minPremium();
      const maxPayout = await flightInsurance.maxPayout();
      const defaultDelayThreshold = await flightInsurance.defaultDelayThreshold();
      
      console.log("\nContract Information:");
      console.log(`Minimum Premium: ${hre.ethers.formatEther(minPremium)} ETH`);
      console.log(`Maximum Payout: ${hre.ethers.formatEther(maxPayout)} ETH`);
      console.log(`Default Delay Threshold: ${Math.floor(defaultDelayThreshold / 60)} minutes`);
      
      const balance = await hre.ethers.provider.getBalance(flightInsuranceAddress);
      console.log(`Contract Balance: ${hre.ethers.formatEther(balance)} ETH`);
      
      await menu();
    } catch (error) {
      console.error("Error getting contract info:", error);
      await menu();
    }
  };

  // Option 2: Purchase a policy
  const purchasePolicy = async () => {
    readline.question("Enter flight number (e.g., AA123): ", (flightNumber) => {
      readline.question("Enter departure time (UTC unix timestamp): ", async (departureTime) => {
        readline.question(`Enter premium amount in ETH (min ${hre.ethers.formatEther(await flightInsurance.minPremium())} ETH): `, async (premium) => {
          try {
            const tx = await flightInsurance.purchasePolicy(
              flightNumber,
              departureTime,
              { value: hre.ethers.parseEther(premium) }
            );
            
            console.log(`Transaction hash: ${tx.hash}`);
            console.log("Waiting for confirmation...");
            
            const receipt = await tx.wait();
            console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
            
            // Find the PolicyPurchased event
            const event = receipt.logs.find(
              log => log.fragment && log.fragment.name === "PolicyPurchased"
            );
            
            if (event) {
              const policyId = event.args[0];
              console.log(`Policy purchased successfully with ID: ${policyId}`);
            } else {
              console.log("Policy purchased successfully");
            }
            
            await menu();
          } catch (error) {
            console.error("Error purchasing policy:", error);
            await menu();
          }
        });
      });
    });
  };

  // Option 3: Get policy details
  const getPolicyDetails = async () => {
    readline.question("Enter policy ID: ", async (policyId) => {
      try {
        const policy = await flightInsurance.getPolicyDetails(policyId);
        
        const statusMap = ["Active", "Expired", "Claimed", "Cancelled"];
        
        console.log("\nPolicy Details:");
        console.log(`ID: ${policy.policyId}`);
        console.log(`Policyholder: ${policy.policyholder}`);
        console.log(`Flight Number: ${policy.flightNumber}`);
        console.log(`Departure Time: ${new Date(Number(policy.departureTime) * 1000).toUTCString()}`);
        console.log(`Premium: ${hre.ethers.formatEther(policy.premium)} ETH`);
        console.log(`Payout Amount: ${hre.ethers.formatEther(policy.payoutAmount)} ETH`);
        console.log(`Paid: ${policy.isPaid}`);
        console.log(`Claimed: ${policy.isClaimed}`);
        console.log(`Delay Threshold: ${Math.floor(policy.delayThreshold / 60)} minutes`);
        console.log(`Status: ${statusMap[policy.status]}`);
        
        await menu();
      } catch (error) {
        console.error("Error getting policy details:", error);
        await menu();
      }
    });
  };

  // Option 4: List my policies
  const listMyPolicies = async () => {
    try {
      const policyIds = await flightInsurance.getPoliciesByUser(deployer.address);
      
      console.log("\nYour Policies:");
      if (policyIds.length === 0) {
        console.log("You have no policies");
      } else {
        for (let i = 0; i < policyIds.length; i++) {
          const policy = await flightInsurance.getPolicyDetails(policyIds[i]);
          const statusMap = ["Active", "Expired", "Claimed", "Cancelled"];
          
          console.log(`\nPolicy #${i + 1}`);
          console.log(`ID: ${policy.policyId}`);
          console.log(`Flight Number: ${policy.flightNumber}`);
          console.log(`Departure: ${new Date(Number(policy.departureTime) * 1000).toUTCString()}`);
          console.log(`Status: ${statusMap[policy.status]}`);
        }
      }
      
      await menu();
    } catch (error) {
      console.error("Error listing policies:", error);
      await menu();
    }
  };

  // Option 5: Cancel policy
  const cancelPolicy = async () => {
    readline.question("Enter policy ID to cancel: ", async (policyId) => {
      try {
        const tx = await flightInsurance.cancelPolicy(policyId);
        console.log(`Transaction hash: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        console.log("Policy cancelled successfully");
        
        await menu();
      } catch (error) {
        console.error("Error cancelling policy:", error);
        await menu();
      }
    });
  };

  // Option 6: Claim policy
  const claimPolicy = async () => {
    readline.question("Enter policy ID to claim: ", async (policyId) => {
      try {
        const tx = await flightInsurance.claimPolicy(policyId);
        console.log(`Transaction hash: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        console.log("Policy claimed successfully");
        
        await menu();
      } catch (error) {
        console.error("Error claiming policy:", error);
        await menu();
      }
    });
  };

  // Option 7: Update delay threshold
  const updateDelayThreshold = async () => {
    readline.question("Enter new delay threshold in minutes: ", async (minutes) => {
      try {
        const tx = await flightInsurance.updateDelayThreshold(minutes);
        console.log(`Transaction hash: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`Delay threshold updated to ${minutes} minutes`);
        
        await menu();
      } catch (error) {
        console.error("Error updating delay threshold:", error);
        await menu();
      }
    });
  };

  // Option 8: Withdraw funds
  const withdrawFunds = async () => {
    readline.question("Enter amount to withdraw in ETH (0 for all): ", async (amount) => {
      try {
        const contractBalance = await hre.ethers.provider.getBalance(flightInsuranceAddress);
        
        let withdrawAmount;
        if (amount === "0") {
          withdrawAmount = contractBalance;
        } else {
          withdrawAmount = hre.ethers.parseEther(amount);
        }
        
        const tx = await flightInsurance.withdrawFunds(withdrawAmount);
        console.log(`Transaction hash: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`Withdrew ${hre.ethers.formatEther(withdrawAmount)} ETH successfully`);
        
        await menu();
      } catch (error) {
        console.error("Error withdrawing funds:", error);
        await menu();
      }
    });
  };

  // Start the menu
  await menu();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});