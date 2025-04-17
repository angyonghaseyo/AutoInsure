require("dotenv").config();
const fetch = require("node-fetch");
const { ethers } = require("ethers");

const abi = [
  "event OracleRequest(bytes32 indexed requestId, address indexed oracleAddress, string url, string path)",
  "function fulfillDataFromOffChain(bytes32 requestId, uint256 data) external",
];

// Set up provider and signer
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://localhost:8545");


// Set up wallet to be able to callback to mockoracle
let wallet;
try {
  const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  wallet = new ethers.Wallet(privateKey, provider);
  console.log(`Wallet configured with address: ${wallet.address}`);
} catch (error) {
  console.error("Error initializing wallet. Make sure PRIVATE_KEY is valid.");
  console.error(error.message);
  wallet = ethers.Wallet.createRandom().connect(provider);
  console.log(`Using generated test wallet: ${wallet.address}`);
}

// contract address
const contractAddress = process.env.ORACLE_CONTRACT_ADDRESS;
if (!contractAddress) {
  console.error("ORACLE_CONTRACT_ADDRESS environment variable is not set.");
  process.exit(1);
}

// connect mock oracle, event emitted and wallet to callback with to make new contract
const contract = new ethers.Contract(contractAddress, abi, wallet);

console.log("Listening for OracleRequest events...");
console.log(`Connected to RPC: ${process.env.RPC_URL}`);
console.log(`Oracle contract address: ${contractAddress}`);

async function handleOracleRequest(requestId, oracleAddress, url, path) {
  console.log(`Handling OracleRequest for URL: ${url} with path: ${path}`);
  try {
    const fetchTimeout = 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const json = await res.json();

    console.log("-----");
    console.log("API Response:", json);
    console.log(`Data from path '${path}':`, json[path]);
    console.log("-----");

    const data = json[path];
    //const data = path.split('.').reduce((obj, key) => (obj || {})[key], json);
    
    // Verify we got a valid number from the API
    if (typeof data !== 'number') {
      console.error(`Invalid data received. Expected number, got ${typeof data}: ${data}`);
      return;
    }

    console.log(`Submitting data: ${data} back to mock oracle for request ${requestId}`);
    const tx = await contract.fulfillDataFromOffChain(requestId, data);
    console.log(`Transaction submitted: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error("API request timed out.");
    } else {
      console.error("Error fulfilling:", err.message);
    }
  }
}

contract.on("OracleRequest", async (...args) => {
  //console.log("Raw OracleRequest event args:", args);

  const event = args[args.length - 1];
  if (!event || !event.args) {
    console.log("Event object missing or args not available");
    return;
  }

  const { requestId, oracleAddress, url, path } = event.args;
  console.log("OracleRequest event received");
  console.log("Request ID:", requestId);
  console.log("URL:", url);
  console.log("Path:", path);

  try {
    await handleOracleRequest(requestId, oracleAddress, url, path);
  } catch (e) {
    console.error("Listener handler error:", e);
  }
});



console.log("Listener is fully initialized and ready");

process.on('uncaughtException', (error) => {
  console.error("Uncaught exception:", error.message);
});

process.on('SIGINT', () => {
  console.log('Shutting down listener...');
  process.exit(0);
});

// Keep process running
setInterval(() => {}, 1 << 30);

// Export for testing
module.exports = handleOracleRequest;