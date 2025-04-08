const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Flight Insurance contracts...");

  // 1. Deploy FlightPolicy (modular contract)
  const FlightPolicy = await hre.ethers.getContractFactory("FlightPolicy");
  const flightPolicy = await FlightPolicy.deploy();
  await flightPolicy.waitForDeployment();

  const flightPolicyAddress = await flightPolicy.getAddress();
  console.log(`FlightPolicy (Library) deployed at: ${flightPolicyAddress}`);

  // 2. Deploy Insurer as the main application entry point
  const Insurer = await hre.ethers.getContractFactory("Insurer");
  const insurer = await Insurer.deploy(flightPolicyAddress);
  await insurer.waitForDeployment();

  const insurerAddress = await insurer.getAddress();
  console.log(`Insurer (Main Entry) deployed at: ${insurerAddress}`);

  // 3. Deploy Oracle Connector and Relevant Components

  const OracleConnector = await hre.ethers.getContractFactory("OracleConnector")
  const MockOracle = await hre.ethers.getContractFactory("MockOracle")

  const oracleConnector = await OracleConnector.deploy()
  await oracleConnector.waitForDeployment()
  const oracleConnectorAddress = oracleConnector.getAddress()
  console.log(`OracleConnector deployed at: ${oracleConnectorAddress}`)

  const mockOracle = await MockOracle.deploy()
  await mockOracle.waitForDeployment()
  const mockOracleAddress = mockOracle.getAddress()
  console.log(`MockOracle deployed at: ${mockOracleAddress}`)


  // 4. Deployment Summary
  console.log("\n-------------------------------------");
  console.log("Deployment Summary:");
  console.log("-------------------------------------");
  console.log(`Network: ${hre.network.name}`);
  console.log(`FlightPolicy: ${flightPolicyAddress}`);
  console.log(`Insurer: ${insurerAddress}`);
  console.log(`OracleConnector: ${oracleConnectorAddress}`)
  console.log(`MockOracle: ${mockOracleAddress}`)
  console.log("-------------------------------------\n");

  // 5. Optional: Wait for Etherscan index (5 blocks)
  // console.log(Waiting for 5 block confirmations...");
  // await insurer.deploymentTransaction().wait(5);
  if (!["hardhat", "localhost"].includes(hre.network.name)) {
    console.log("Waiting for 5 block confirmations...");
    await insurer.deploymentTransaction().wait(5);
  }

  // 6. Update dapp contractAddresses.json
  const contractAddressesPath = path.join(__dirname, "../../dapp/src/utils/contractAddresses.json");
  let existingData = {};

  try {
    if (fs.existsSync(contractAddressesPath)) {
      existingData = JSON.parse(fs.readFileSync(contractAddressesPath, "utf8"));
    }
  } catch (error) {
    console.error("Error reading contractAddresses.json:", error);
  }

  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();

  existingData[chainId] = {
    Insurer: insurerAddress,
    FlightPolicy: flightPolicyAddress,
  };

  fs.writeFileSync(contractAddressesPath, JSON.stringify(existingData, null, 2));

  console.log(`Updated contract addresses in ${contractAddressesPath}`);

  // 7. Export ABIs to dapp for use with ethers.js
  const abisOutputPath = path.join(__dirname, "../../dapp/src/utils/abis");
  if (!fs.existsSync(abisOutputPath)) {
    fs.mkdirSync(abisOutputPath, { recursive: true });
  }

  const flightPolicyArtifact = await hre.artifacts.readArtifact("FlightPolicy");
  const insurerArtifact = await hre.artifacts.readArtifact("Insurer");

  fs.writeFileSync(path.join(abisOutputPath, "FlightPolicy.json"), JSON.stringify(flightPolicyArtifact, null, 2));
  fs.writeFileSync(path.join(abisOutputPath, "Insurer.json"), JSON.stringify(insurerArtifact, null, 2));

  console.log(`ABIs saved to: ${abisOutputPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
