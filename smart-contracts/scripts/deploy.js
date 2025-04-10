const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying Flight Insurance contracts...");

  // 1. Deploy Mock LINK Token
  const MockLinkToken = await hre.ethers.getContractFactory("MockLinkToken");
  const mockLinkToken = await MockLinkToken.deploy();
  await mockLinkToken.waitForDeployment();
  const mockLinkTokenAddress = await mockLinkToken.getAddress();
  console.log(`Mock LINK Token deployed at: ${mockLinkTokenAddress}`);

  // 2. Deploy Mock Oracle
  const MockOracle = await hre.ethers.getContractFactory("MockOracle");
  const mockOracle = await MockOracle.deploy(mockLinkTokenAddress);
  await mockOracle.waitForDeployment();
  const mockOracleAddress = await mockOracle.getAddress();
  console.log(`Mock Oracle deployed at: ${mockOracleAddress}`);

  // 3. Deploy Oracle Connector
  const OracleConnector = await hre.ethers.getContractFactory("OracleConnector");
  const oracleConnector = await OracleConnector.deploy(mockLinkTokenAddress);
  await oracleConnector.waitForDeployment();
  const oracleConnectorAddress = await oracleConnector.getAddress();
  console.log(`Oracle Connector deployed at: ${oracleConnectorAddress}`);

  // 4. Deploy FlightPolicy
  const FlightPolicy = await hre.ethers.getContractFactory("FlightPolicy");
  const flightPolicy = await FlightPolicy.deploy(oracleConnectorAddress);
  await flightPolicy.waitForDeployment();
  const flightPolicyAddress = await flightPolicy.getAddress();
  console.log(`FlightPolicy deployed at: ${flightPolicyAddress}`);

  // 5. Deploy BaggagePolicy
  const BaggagePolicy = await hre.ethers.getContractFactory("BaggagePolicy");
  const baggagePolicy = await BaggagePolicy.deploy(oracleConnectorAddress);
  await baggagePolicy.waitForDeployment();
  const baggagePolicyAddress = await baggagePolicy.getAddress();
  console.log(`BaggagePolicy deployed at: ${baggagePolicyAddress}`);

  // 6. Deploy Insurer (main entry)
  const Insurer = await hre.ethers.getContractFactory("Insurer");
  const insurer = await Insurer.deploy(flightPolicyAddress);
  await insurer.waitForDeployment();
  const insurerAddress = await insurer.getAddress();
  console.log(`Insurer deployed at: ${insurerAddress}`);

  // Deployment Summary
  console.log("\nDeployment Summary:");
  console.log("-----------------------------");
  console.log(`Mock LINK Token:  ${mockLinkTokenAddress}`);
  console.log(`Mock Oracle:      ${mockOracleAddress}`);
  console.log(`Oracle Connector: ${oracleConnectorAddress}`);
  console.log(`FlightPolicy:     ${flightPolicyAddress}`);
  console.log(`BaggagePolicy:    ${baggagePolicyAddress}`);
  console.log(`Insurer:          ${insurerAddress}`);
  console.log("-----------------------------");

  // Save addresses and ABIs for frontend
  const outputDir = path.join(__dirname, "../../dapp/src/utils");
  const abisDir = path.join(outputDir, "abis");

  if (!fs.existsSync(abisDir)) fs.mkdirSync(abisDir, { recursive: true });

  const addresses = {
    MockLinkToken: mockLinkTokenAddress,
    MockOracle: mockOracleAddress,
    OracleConnector: oracleConnectorAddress,
    FlightPolicy: flightPolicyAddress,
    BaggagePolicy: baggagePolicyAddress,
    Insurer: insurerAddress,
  };

  const contractAddressesPath = path.join(__dirname, "../../dapp/src/utils/contractAddresses.json");
  let existingData = {};

  try {
    // If file exists, read and parse the data
    if (fs.existsSync(contractAddressesPath)) {
      existingData = JSON.parse(fs.readFileSync(contractAddressesPath, "utf8"));
    }
  } catch (error) {
    console.error("Error reading contractAddresses.json:", error);
  }

  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();

  // If the chainId entry does not exist, create a new one
  if (!existingData[chainId]) {
    existingData[chainId] = {
      MockLinkToken: "",
      MockOracle: "",
      OracleConnector: "",
      FlightPolicy: "",
      BaggagePolicy: "",
      Insurer: "",
    };
  }

  // Add the new addresses to the corresponding chainId entry
  existingData[chainId].MockLinkToken = mockLinkTokenAddress;
  existingData[chainId].MockOracle = mockOracleAddress;
  existingData[chainId].OracleConnector = oracleConnectorAddress;
  existingData[chainId].FlightPolicy = flightPolicyAddress;
  existingData[chainId].BaggagePolicy = baggagePolicyAddress;
  existingData[chainId].Insurer = insurerAddress;

  // Write the updated data back to the JSON file
  fs.writeFileSync(contractAddressesPath, JSON.stringify(existingData, null, 2));
  console.log(`Updated contract addresses in ${contractAddressesPath}`);

  // Export ABIs to dapp
  fs.writeFileSync(path.join(abisDir, "FlightPolicy.json"), JSON.stringify(await hre.artifacts.readArtifact("FlightPolicy"), null, 2));
  fs.writeFileSync(path.join(abisDir, "BaggagePolicy.json"), JSON.stringify(await hre.artifacts.readArtifact("BaggagePolicy"), null, 2));
  fs.writeFileSync(path.join(abisDir, "OracleConnector.json"), JSON.stringify(await hre.artifacts.readArtifact("OracleConnector"), null, 2));
  fs.writeFileSync(path.join(abisDir, "Insurer.json"), JSON.stringify(await hre.artifacts.readArtifact("Insurer"), null, 2));

  console.log("✅ ABIs and addresses exported for dapp.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
