// Backend auto on-chain push: push the multi-AI risk score to a fixed RiskOracle contract.
// Uses the owner to write directly (setRisk) — fast (single transaction), fixed address, truly automatic.
// The full FDC attestation was already validated as feasible in M2/M3; this is a lightweight channel for keeping the oracle running continuously and automatically.
require("dotenv").config();
const { ethers } = require("ethers");
const { logsCall } = require("./rpc-pool");

const RPC = "https://coston2-api.flare.network/ext/C/rpc";
// RiskOracle contract (owner = main project test wallet 0x90d0..., exposes setRisk/getRisk)
const CONTRACT = "0x29D2567bbD5979426fadAdB8991C10dE267f4304";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ABI = [
  "function setRisk(uint256 _score, string _reason) external",
  "function getRisk() view returns (uint256 score, string reason, uint256 updatedAt)",
  "event RiskUpdated(uint256 score, string reason, uint256 timestamp)",
];

// Whether a private key is configured (if not, auto on-chain push is silently skipped without affecting the main AI risk-analysis flow)
const onchainEnabled = !!PRIVATE_KEY;

let wallet, contract;
function init() {
  if (contract) return contract;
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY not configured, auto on-chain push skipped");
  const provider = new ethers.JsonRpcProvider(RPC);
  const pk = PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : "0x" + PRIVATE_KEY;
  wallet = new ethers.Wallet(pk, provider);
  contract = new ethers.Contract(CONTRACT, ABI, wallet);
  return contract;
}

async function pushRisk(score, reason) {
  if (!onchainEnabled) return null;
  const c = init();
  const tx = await c.setRisk(score, String(reason).slice(0, 120));
  await tx.wait();
  return { txHash: tx.hash, contract: CONTRACT };
}

async function readOnchainRisk() {
  const c = init();
  const r = await c.getRisk();
  return { score: Number(r.score), reason: r.reason, timestamp: Number(r.updatedAt) };
}

// Rebuild history from on-chain RiskUpdated event logs (the tamper-proof on-chain source of truth)
async function readOnchainHistory() {
  return logsCall(async (provider) => {
    const c = new ethers.Contract(CONTRACT, ABI, provider);
    const latest = await provider.getBlockNumber();
    const fromBlock = Math.max(0, latest - 1000);
    const events = await c.queryFilter(c.filters.RiskUpdated(), fromBlock, latest);
    return events.map((e) => ({
      score: Number(e.args.score),
      reason: e.args.reason,
      at: Number(e.args.timestamp),
      txHash: e.transactionHash,
      block: e.blockNumber,
    }));
  });
}

module.exports = { pushRisk, readOnchainRisk, readOnchainHistory, CONTRACT };
