require("dotenv").config();
const { ethers } = require("ethers");
const fetch = require("node-fetch");
const get = require("lodash.get");

const oracleAbi = [
  "event MockFlightRequest(bytes32 indexed requestId, address requester, string url, string path, bytes4 callbackFunction)",
  "function fulfillData(bytes32 requestId, string calldata data) external",
];

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const oracle = new ethers.Contract(process.env.ORACLE_CONTRACT_ADDRESS, oracleAbi, wallet);

console.log("Listening for flight data requests");

oracle.on("MockFlightRequest", async (requestId, requester, url, path, callbackFn) => {
  console.log(`\nFlight data request received`);
  console.log(`URL: ${url}`);
  console.log(`JSON path: ${path}`);
  console.log(`Callback: ${callbackFn}`);
  console.log(`Request ID: ${requestId}`);

  try {
    const res = await fetch(url);
    const json = await res.json();

    const extracted = get(json, path); // path like "data.delayMinutes"
    if (!extracted) {
      console.warn("Could not extract data from path:", path);
      return;
    }

    console.log(`Extracted data: ${extracted}`);

    const tx = await oracle.fulfillData(requestId, extracted.toString());
    await tx.wait();

    console.log("Fulfilled request on-chain!\n");
  } catch (err) {
    console.error("Failed to fulfill request:", err);
  }
});
