const hre = require("hardhat");

async function main() {
  console.log("Deploying Flight Insurance contracts...");

  // Deploy the OracleConnector
  const OracleConnector = await hre.ethers.getContractFactory("OracleConnector");
  const oracleConnector = await OracleConnector.deploy();
  await oracleConnector.waitForDeployment();

  const oracleConnectorAddress = await oracleConnector.getAddress();
  console.log(`OracleConnector deployed to: ${oracleConnectorAddress}`);

  // Deploy the FlightPolicy
  const FlightPolicy = await hre.ethers.getContractFactory("FlightPolicy");
  const flightPolicy = await FlightPolicy.deploy("0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"); //Company Wallet Address
  await flightPolicy.waitForDeployment();

  const flightPolicyAddress = await flightPolicy.getAddress();
  console.log(`FlightPolicy deployed to: ${flightPolicyAddress}`);

  // Then deploy the insurer contract using the OracleConnector address
  const Insurer = await hre.ethers.getContractFactory("Insurer");
  const insurer = await Insurer.deploy("0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"); //Company Wallet Address
  await insurer.waitForDeployment();

  const insurerAddress = await insurer.getAddress();
  console.log(`insurer deployed to: ${insurerAddress}`);

  // Display deployment information for verification
  console.log("-------------------------------------");
  console.log("Deployment Summary:");
  console.log("-------------------------------------");
  console.log(`Network: ${hre.network.name}`);
  console.log(`OracleConnector: ${oracleConnectorAddress}`);
  console.log(`insurer: ${insurerAddress}`);
  console.log("-------------------------------------");

  // Allow some time for Etherscan to index the contracts
  console.log("Waiting for block confirmation...");
  await insurer.deploymentTransaction().wait(5);

  // Verify contracts on Etherscan (if not on local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contracts on Etherscan...");

    try {
      await hre.run("verify:verify", {
        address: oracleConnectorAddress,
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: insurerAddress,
        constructorArguments: [oracleConnectorAddress],
      });

      console.log("Contracts verified successfully on Etherscan!");
    } catch (error) {
      console.error("Error verifying contracts:", error);
    }
  }

  // Export deployment data to a file
  const fs = require("fs");
  const deploymentData = {
    network: hre.network.name,
    oracleConnector: oracleConnectorAddress,
    insurer: insurerAddress,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(`deployment-${hre.network.name}.json`, JSON.stringify(deploymentData, null, 2));
  console.log(`Deployment data saved to deployment-${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
