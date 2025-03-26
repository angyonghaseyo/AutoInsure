const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Flight Insurance contracts...");

  // 1. Deploy FlightPolicy (modular contract)
  const FlightPolicy = await hre.ethers.getContractFactory("FlightPolicy");
  const flightPolicy = await FlightPolicy.deploy();
  await flightPolicy.waitForDeployment();

  const flightPolicyAddress = await flightPolicy.getAddress();
  console.log(`📦 FlightPolicy (Library) deployed at: ${flightPolicyAddress}`);

  // 2. Deploy Insurer as the main application entry point
  const Insurer = await hre.ethers.getContractFactory("Insurer");
  const insurer = await Insurer.deploy(flightPolicyAddress);
  await insurer.waitForDeployment();

  const insurerAddress = await insurer.getAddress();
  console.log(`🛡️ Insurer (Main Entry) deployed at: ${insurerAddress}`);

  // 3. Deployment Summary
  console.log("\n-------------------------------------");
  console.log("📜 Deployment Summary:");
  console.log("-------------------------------------");
  console.log(`📌 Network: ${hre.network.name}`);
  console.log(`📦 FlightPolicy: ${flightPolicyAddress}`);
  console.log(`🛡️ Insurer: ${insurerAddress}`);
  console.log("-------------------------------------\n");

  // 4. Optional: Wait for Etherscan index (5 blocks)
  if (!["hardhat", "localhost"].includes(hre.network.name)) {
    console.log("⏳ Waiting for 5 block confirmations...");
    await insurer.deploymentTransaction().wait(5);
  }

  // 5. Verify contracts (only for testnet/mainnet)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("🔍 Verifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: flightPolicyAddress,
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: insurerAddress,
        constructorArguments: [flightPolicyAddress],
      });

      console.log("✅ Contracts verified on Etherscan!");
    } catch (error) {
      console.error("❌ Verification error:", error);
    }
  }

  // 6. Update frontend contractAddresses.json
  const contractAddressesPath = path.join(__dirname, "../../frontend/src/utils/contractAddresses.json");
  let existingData = {};

  try {
    if (fs.existsSync(contractAddressesPath)) {
      existingData = JSON.parse(fs.readFileSync(contractAddressesPath, "utf8"));
    }
  } catch (error) {
    console.error("⚠️ Error reading contractAddresses.json:", error);
  }

  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();

  existingData[chainId] = {
    Insurer: insurerAddress,
    FlightPolicy: flightPolicyAddress,
  };

  fs.writeFileSync(contractAddressesPath, JSON.stringify(existingData, null, 2));

  console.log(`✅ Updated contract addresses in ${contractAddressesPath}`);

  // 7. Export ABIs to frontend for use with ethers.js
  const abisOutputPath = path.join(__dirname, "../../frontend/src/utils/abis");
  if (!fs.existsSync(abisOutputPath)) {
    fs.mkdirSync(abisOutputPath, { recursive: true });
  }

  const flightPolicyArtifact = await hre.artifacts.readArtifact("FlightPolicy");
  const insurerArtifact = await hre.artifacts.readArtifact("Insurer");

  fs.writeFileSync(path.join(abisOutputPath, "FlightPolicy.json"), JSON.stringify(flightPolicyArtifact, null, 2));
  fs.writeFileSync(path.join(abisOutputPath, "Insurer.json"), JSON.stringify(insurerArtifact, null, 2));

  console.log(`✅ ABIs saved to: ${abisOutputPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
