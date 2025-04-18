const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

async function main() {
  console.log("Deploying Flight Insurance contracts...");

  // 1. Deploy Mock LINK Token
  const MockLinkToken = await hre.ethers.getContractFactory("MockLinkToken");
  const mockLinkToken = await MockLinkToken.deploy();
  await mockLinkToken.waitForDeployment();
  const mockLinkTokenAddress = await mockLinkToken.getAddress();
  console.log(`Mock LINK Token deployed at: ${mockLinkTokenAddress}`);

  // 2. Deploy Mock Oracle (First Oracle)
  const MockOracle = await hre.ethers.getContractFactory("MockOracle");
  const mockOracle = await MockOracle.deploy(mockLinkTokenAddress);
  await mockOracle.waitForDeployment();
  const mockOracleAddress = await mockOracle.getAddress();
  console.log(`First Mock Oracle deployed at: ${mockOracleAddress}`);

  // 3. Deploy additional Mock Oracles
  const mockOracle2 = await MockOracle.deploy(mockLinkTokenAddress);
  await mockOracle2.waitForDeployment();
  const mockOracle2Address = await mockOracle2.getAddress();
  console.log(`Second Mock Oracle deployed at: ${mockOracle2Address}`);
  
  const mockOracle3 = await MockOracle.deploy(mockLinkTokenAddress);
  await mockOracle3.waitForDeployment();
  const mockOracle3Address = await mockOracle3.getAddress();
  console.log(`Third Mock Oracle deployed at: ${mockOracle3Address}`);

  // 4. Deploy Oracle Connector
  const OracleConnector = await hre.ethers.getContractFactory("OracleConnector");
  const oracleConnector = await OracleConnector.deploy(mockLinkTokenAddress);
  await oracleConnector.waitForDeployment();
  const oracleConnectorAddress = await oracleConnector.getAddress();
  console.log(`Oracle Connector deployed at: ${oracleConnectorAddress}`);

  // 5. Deploy FlightPolicy
  const FlightPolicy = await hre.ethers.getContractFactory("FlightPolicy");
  const flightPolicy = await FlightPolicy.deploy(oracleConnectorAddress);
  await flightPolicy.waitForDeployment();
  const flightPolicyAddress = await flightPolicy.getAddress();
  console.log(`FlightPolicy deployed at: ${flightPolicyAddress}`);

  // 6. Deploy BaggagePolicy
  const BaggagePolicy = await hre.ethers.getContractFactory("BaggagePolicy");
  const baggagePolicy = await BaggagePolicy.deploy(oracleConnectorAddress);
  await baggagePolicy.waitForDeployment();
  const baggagePolicyAddress = await baggagePolicy.getAddress();
  console.log(`BaggagePolicy deployed at: ${baggagePolicyAddress}`);

  // 7. Deploy Insurer (main entry)
  const Insurer = await hre.ethers.getContractFactory("Insurer");
  const insurer = await Insurer.deploy(flightPolicyAddress, baggagePolicyAddress);
  await insurer.waitForDeployment();
  const insurerAddress = await insurer.getAddress();
  console.log(`Insurer deployed at: ${insurerAddress}`);

  // 8. Configure oracles with multiple sources
  console.log("\nConfiguring multiple oracles...");
  
  // Fund the Oracle Connector with LINK tokens
  await mockLinkToken.transfer(oracleConnectorAddress, hre.ethers.parseEther("100"));
  console.log("Funded Oracle Connector with 100 LINK tokens");
  
  // Define oracle configurations (multiple oracles with multiple endpoints)
  const oracleConfigs = [
    // First Oracle Provider
    {
      address: mockOracleAddress,
      endpoints: [
        {
          url: "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/",
          jobId: "oracle1_primary",
          description: "Oracle 1 - Primary endpoint (120 mins delay for SQ100)"
        }
      ]
    },
    // Second Oracle Provider
    {
      address: mockOracle2Address,
      endpoints: [
        {
          url: "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/alternative/",
          jobId: "oracle2_primary",
          description: "Oracle 2 - Alternative endpoint 1 (180 mins delay for SQ100)"
        }
      ]
    },
    // Third Oracle Provider
    {
      address: mockOracle3Address,
      endpoints: [
        {
          url: "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/alternative2/",
          jobId: "oracle3_primary",
          description: "Oracle 3 - Alternative endpoint 2 (240 mins delay for SQ100)"
        }
      ]
    }
  ];
  
  // Add all oracle endpoints
  for (const oracleConfig of oracleConfigs) {
    for (const endpoint of oracleConfig.endpoints) {
      console.log(`Adding oracle: ${endpoint.description}`);
      console.log(`Oracle Address: ${oracleConfig.address}`);
      console.log(`URL: ${endpoint.url}`);
      
      const formattedJobId = hre.ethers.encodeBytes32String(endpoint.jobId);
      const tx = await oracleConnector.addOracle(
        oracleConfig.address,
        endpoint.url,
        formattedJobId
      );
      
      await tx.wait();
      console.log(`Oracle added with job ID: ${endpoint.jobId}`);
      console.log("-----------------------------------");
    }
  }
  
  console.log("Oracle configuration complete!");

  // Deployment Summary
  console.log("\nDeployment Summary:");
  console.log("-----------------------------");
  console.log(`Mock LINK Token:  ${mockLinkTokenAddress}`);
  console.log(`Mock Oracle 1:    ${mockOracleAddress}`);
  console.log(`Mock Oracle 2:    ${mockOracle2Address}`);
  console.log(`Mock Oracle 3:    ${mockOracle3Address}`);
  console.log(`Oracle Connector: ${oracleConnectorAddress}`);
  console.log(`FlightPolicy:     ${flightPolicyAddress}`);
  console.log(`BaggagePolicy:    ${baggagePolicyAddress}`);
  console.log(`Insurer:          ${insurerAddress}`);
  console.log("-----------------------------");

  const listenerEnvPath = path.join(__dirname, "../listener/.env");
  const envContent = `
    RPC_URL=http://127.0.0.1:8545
    PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    ORACLE_CONTRACT_ADDRESS=${await mockOracle.getAddress()}
  `;
  fs.writeFileSync(listenerEnvPath, envContent);

  console.log(`Test ${await mockOracle.getAddress()}`)

  const hardhatPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const listenerPath = path.join(__dirname, "../listener/listener.js");
  listenerProcess = spawn("node", [listenerPath], {
    env: {
      ...process.env,
      RPC_URL: "http://127.0.0.1:8545",
      PRIVATE_KEY: hardhatPrivateKey, // Use the hardhat test account private key
      ORACLE_CONTRACT_ADDRESS: await mockOracle.getAddress(),
      // Point to our temporary env file
      DOTENV_CONFIG_PATH: listenerEnvPath
    }
  });

  // Log listener output
  listenerProcess.stdout.on("data", (data) => {
    console.log(`Listener: ${data}`);
  });

  listenerProcess.stderr.on("data", (data) => {
    console.error(`Listener Error: ${data}`);
  });

  // Wait for listener to boot up
  console.log("Waiting for listener to start...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('Listener Started')

  // Save addresses and ABIs for frontend
  const outputDir = path.join(__dirname, "../../dapp/src/utils");
  const abisDir = path.join(outputDir, "abis");

  if (!fs.existsSync(abisDir)) fs.mkdirSync(abisDir, { recursive: true });

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
      MockOracle2: "",
      MockOracle3: "",
      OracleConnector: "",
      FlightPolicy: "",
      BaggagePolicy: "",
      Insurer: "",
    };
  }

  // Add the new addresses to the corresponding chainId entry
  existingData[chainId].MockLinkToken = mockLinkTokenAddress;
  existingData[chainId].MockOracle = mockOracleAddress;
  existingData[chainId].MockOracle2 = mockOracle2Address;
  existingData[chainId].MockOracle3 = mockOracle3Address;
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
  fs.writeFileSync(path.join(abisDir, "MockOracle.json"), JSON.stringify(await hre.artifacts.readArtifact("MockOracle"), null, 2));

  console.log("ABIs and addresses exported for dapp.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});