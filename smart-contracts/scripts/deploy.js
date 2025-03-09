const hre = require("hardhat");

async function main() {
  console.log("Deploying Flight Insurance contracts...");

  // First deploy the OracleConnector
  const OracleConnector = await hre.ethers.getContractFactory("OracleConnector");
  const oracleConnector = await OracleConnector.deploy();
  await oracleConnector.waitForDeployment();
  
  const oracleConnectorAddress = await oracleConnector.getAddress();
  console.log(`OracleConnector deployed to: ${oracleConnectorAddress}`);

  // Then deploy the FlightInsurance contract using the OracleConnector address
  const FlightInsurance = await hre.ethers.getContractFactory("FlightInsurance");
  const flightInsurance = await FlightInsurance.deploy(oracleConnectorAddress);
  await flightInsurance.waitForDeployment();
  
  const flightInsuranceAddress = await flightInsurance.getAddress();
  console.log(`FlightInsurance deployed to: ${flightInsuranceAddress}`);

  // Display deployment information for verification
  console.log("-------------------------------------");
  console.log("Deployment Summary:");
  console.log("-------------------------------------");
  console.log(`Network: ${hre.network.name}`);
  console.log(`OracleConnector: ${oracleConnectorAddress}`);
  console.log(`FlightInsurance: ${flightInsuranceAddress}`);
  console.log("-------------------------------------");

  // Allow some time for Etherscan to index the contracts
  console.log("Waiting for block confirmation...");
  await flightInsurance.deploymentTransaction().wait(5);
  
  // Verify contracts on Etherscan (if not on local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: oracleConnectorAddress,
        constructorArguments: [],
      });
      
      await hre.run("verify:verify", {
        address: flightInsuranceAddress,
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
    flightInsurance: flightInsuranceAddress,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    `deployment-${hre.network.name}.json`,
    JSON.stringify(deploymentData, null, 2)
  );
  console.log(`Deployment data saved to deployment-${hre.network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });