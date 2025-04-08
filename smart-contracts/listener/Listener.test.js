
const handleOracleRequest = require('./listener');
const { formatBytes32String } = require('@ethersproject/strings');

(async () => {
  const requestId = formatBytes32String("test123");
  const url = "https://236a3f11-39f2-40f7-989b-d51bcdcca6f2.mock.pstmn.io/SQ100?departure='2025-03-30T15:00:00Z'";
  const path = "delayMinutes";
  const oracleAddress = "0x0000000000000000000000000000000000000001"; // fake

  await handleOracleRequest(requestId, oracleAddress, url, path);
})();