require('dotenv').config();
const { ethers } = require('ethers');
const fetch = require('node-fetch');

const abi = [
  "event OracleRequest(bytes32 indexed requestId, address indexed oracleAddress, string url, string path);",
  "function fulfillDataFromOffChain(bytes32 requestId, uint256 data) external",
];

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e, abi, wallet);

console.log('Listening')

async function handleOracleRequest(requestId, oracleAddress, url, path) {
  console.log(`Handling OracleRequest for URL: ${url} with path ${path}`);
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log('-----')
    console.log(json)
    console.log(json[path])
    const data = json[path];
    console.log('-----')
    console.log(data)

    const tx = await contract.fulfillDataFromOffChain(requestId, data);
    await tx.wait();
    console.log("Data fulfilled on chain");
  } catch (err) {
    console.error("Error fulfilling:", err);
  }
}

// Set up real event listener
contract.on("OracleRequest", handleOracleRequest);

// Export for testing
module.exports = handleOracleRequest;
