const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Flight Insurance contracts...");

  // Deploy FlightPolicy contract first
  const FlightPolicy = await hre.ethers.getContractFactory("FlightPolicy");
  const flightPolicy = await FlightPolicy.deploy();
  await flightPolicy.waitForDeployment();

  const flightPolicyAddress = await flightPolicy.getAddress();
  console.log(`✅ FlightPolicy deployed to: ${flightPolicyAddress}`);

  // Deploy Insurer contract and pass the FlightPolicy address as a constructor argument (properly)
  const Insurer = await hre.ethers.getContractFactory("Insurer");
  const insurer = await Insurer.deploy(flightPolicyAddress);  // ✅ Pass as argument, not overrides
  await insurer.waitForDeployment();

  const insurerAddress = await insurer.getAddress();
  console.log(`✅ Insurer deployed to: ${insurerAddress}`);

  // Deployment Summary
  console.log("\n-------------------------------------");
  console.log("📜 Deployment Summary:");
  console.log("-------------------------------------");
  console.log(`📌 Network: ${hre.network.name}`);
  console.log(`🏛️ FlightPolicy: ${flightPolicyAddress}`);
  console.log(`🛡️ Insurer: ${insurerAddress}`);
  console.log("-------------------------------------\n");

  // Wait for block confirmations before verifying
  console.log("⏳ Waiting for 5 block confirmations...");
  await insurer.deploymentTransaction().wait(5);

  // Verify contracts (for non-local networks)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: flightPolicyAddress,
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: insurerAddress,
        constructorArguments: [flightPolicyAddress],  // ✅ Correctly pass argument
      });

      console.log("✅ Contracts successfully verified on Etherscan!");
    } catch (error) {
      console.error("❌ Error verifying contracts:", error);
    }
  }

  // Update contractAddresses.json
  const contractAddressesPath = "./contractAddresses.json";
  let existingData = {};

  try {
    if (fs.existsSync(contractAddressesPath)) {
      existingData = JSON.parse(fs.readFileSync(contractAddressesPath, "utf8"));
    }
  } catch (error) {
    console.error("⚠️ Error reading contractAddresses.json:", error);
  }

  existingData[hre.network.config.chainId] = {
    insurer: insurerAddress,
    flightPolicy: flightPolicyAddress,
  };

  fs.writeFileSync(
    contractAddressesPath,
    JSON.stringify(existingData, null, 2)
  );

  console.log(`✅ Contract addresses updated in ${contractAddressesPath}`);

  // Export ABIs to frontend
  const abisOutputPath = path.join(__dirname, "../frontend/src/utils/abis");
  if (!fs.existsSync(abisOutputPath)) {
    fs.mkdirSync(abisOutputPath, { recursive: true });
  }

  const flightPolicyArtifact = await hre.artifacts.readArtifact("FlightPolicy");
  const insurerArtifact = await hre.artifacts.readArtifact("Insurer");

  fs.writeFileSync(
    path.join(abisOutputPath, "FlightPolicy.json"),
    JSON.stringify(flightPolicyArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(abisOutputPath, "Insurer.json"),
    JSON.stringify(insurerArtifact, null, 2)
  );

  console.log(`✅ ABIs exported to: ${abisOutputPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
