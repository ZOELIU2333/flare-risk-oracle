// RPC pool + automatic fallback: multiple Coston2 endpoints; if one fails, automatically switch to the next. Handles public-RPC rate limits and instability.
const { ethers } = require("ethers");

// RPC pool for read operations (official + Ankr + other public endpoints); order = priority
const READ_RPCS = [
  "https://coston2-api.flare.network/ext/C/rpc",
  "https://rpc.ankr.com/flare_coston2",
];
// Dedicated pool for getLogs (the official getLogs is unstable, so Ankr takes priority)
const LOGS_RPCS = [
  "https://rpc.ankr.com/flare_coston2",
  "https://coston2-api.flare.network/ext/C/rpc",
];

function makeProvider(url) {
  return new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
}

// Try fn on each RPC in turn until one succeeds; only throw if all fail
async function withFallback(rpcs, fn) {
  let lastErr;
  for (const url of rpcs) {
    try {
      return await fn(makeProvider(url));
    } catch (e) {
      lastErr = e;
      console.warn(`[rpc] ${url.slice(8, 30)}... failed: ${e.message.slice(0, 50)}, trying next`);
    }
  }
  throw lastErr || new Error("all RPCs failed");
}

const readCall = (fn) => withFallback(READ_RPCS, fn);
const logsCall = (fn) => withFallback(LOGS_RPCS, fn);

module.exports = { readCall, logsCall, makeProvider, READ_RPCS, LOGS_RPCS };
