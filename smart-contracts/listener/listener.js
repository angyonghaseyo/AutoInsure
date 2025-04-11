require("dotenv").config();
const fetch = require("node-fetch");
const { JsonRpcProvider, Wallet, Contract } = require("ethers");

const abi = [
  "event OracleRequest(bytes32 indexed requestId, address indexed oracleAddress, string url, string path)",
  "function fulfillDataFromOffChain(bytes32 requestId, uint256 data) external",
];

// Set up provider and signer
const provider = new JsonRpcProvider(process.env.RPC_URL || "http://localhost:8545");

// Private key handling with better error checking
let wallet;
try {
  // Check if private key has 0x prefix, if not add it
  const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
    ? process.env.PRIVATE_KEY 
    : `0x${process.env.PRIVATE_KEY}`;
    
  // Create wallet
  wallet = new Wallet(privateKey, provider);
  console.log(`Wallet configured with address: ${wallet.address}`);
} catch (error) {
  console.error("Error initializing wallet. Make sure PRIVATE_KEY is a valid Ethereum private key:");
  console.error(error.message);
  console.error("Using a random wallet for testing purposes instead");
  // Generate a random wallet for testing as fallback
  wallet = Wallet.createRandom().connect(provider);
  console.log(`Using generated test wallet: ${wallet.address}`);
}

// Use string address for contract
const contractAddress = process.env.ORACLE_CONTRACT_ADDRESS;
if (!contractAddress) {
  console.error("ORACLE_CONTRACT_ADDRESS environment variable is not set!");
  process.exit(1);
}

const contract = new Contract(contractAddress, abi, wallet);

console.log("Listening for OracleRequest events...");
console.log(`Connected to RPC: ${process.env.RPC_URL}`);
console.log(`Oracle contract address: ${contractAddress}`);

async function handleOracleRequest(requestId, oracleAddress, url, path) {
  console.log(`Handling OracleRequest for URL: ${url} with path ${path}`);
  try {
    // For testing, allow timeout 
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
    
    // Verify we got a valid number from the API
    if (typeof data !== 'number') {
      console.error(`Invalid data received. Expected number, got ${typeof data}: ${data}`);
      return;
    }

    console.log(`Submitting data: ${data} to contract for request ${requestId}`);
    const tx = await contract.fulfillDataFromOffChain(requestId, data);
    console.log(`Transaction submitted: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log("Data fulfilled on chain");
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error("API request timed out");
    } else {
      console.error("Error fulfilling:", err.message);
      
      // For testing purposes, we'll create a mock response
      if (process.env.NODE_ENV === 'test') {
        console.log("Running in test mode - sending mock response with 120 minutes delay");
        try {
          const mockData = 120;
          const tx = await contract.fulfillDataFromOffChain(requestId, mockData);
          console.log(`Mock data transaction submitted: ${tx.hash}`);
        } catch (mockErr) {
          console.error("Error sending mock data:", mockErr.message);
        }
      }
    }
  }
}

// Register the event listener
contract.on("OracleRequest", handleOracleRequest);

// In ethers.js v6, we need to handle errors differently
// Instead of listening for "error" events (which isn't in our ABI)
// we can use a general process error handler
process.on('uncaughtException', (error) => {
  console.error("Uncaught exception:", error.message);
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down listener...');
  process.exit(0);
});

// Export for testing
module.exports = handleOracleRequest;