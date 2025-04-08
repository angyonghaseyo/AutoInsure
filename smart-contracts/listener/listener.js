require("dotenv").config();
const fetch = require("node-fetch");
const { JsonRpcProvider, Wallet, Contract } = require("ethers");

const abi = [
  "event OracleRequest(bytes32 indexed requestId, address indexed oracleAddress, string url, string path)",
  "function fulfillDataFromOffChain(bytes32 requestId, uint256 data) external",
];

// Set up provider and signer
const provider = new JsonRpcProvider(process.env.RPC_URL);
const wallet = new Wallet(process.env.PRIVATE_KEY, provider);

// Use string address for contract
const contractAddress = process.env.ORACLE_CONTRACT_ADDRESS
const contract = new Contract(contractAddress, abi, wallet);

console.log("Listening for OracleRequest events...");

async function handleOracleRequest(requestId, oracleAddress, url, path) {
  console.log(`Handling OracleRequest for URL: ${url} with path ${path}`);
  try {
    const res = await fetch(url);
    const json = await res.json();

    console.log("-----");
    console.log(json);
    console.log(json[path]);
    console.log("-----");

    const data = json[path];

    const tx = await contract.fulfillDataFromOffChain(requestId, data);
    await tx.wait();
    console.log("Data fulfilled on chain");
  } catch (err) {
    console.error("Error fulfilling:", err);
  }
}

// Register the event listener
contract.on("OracleRequest", handleOracleRequest);

// Export for testing
module.exports = handleOracleRequest;