// 后端自动上链：把多 AI 风险分 push 到固定的 RiskOracle 合约
// 用 owner 直接写(setRisk)，快(一笔交易)、地址固定、真自动。
// FDC 完整 attestation 已在 M2/M3 验证可行，此处为"预言机持续自动运转"的轻量通道。
require("dotenv").config();
const { ethers } = require("ethers");
const { logsCall } = require("./rpc-pool");

const RPC = "https://coston2-api.flare.network/ext/C/rpc";
// RiskOracle 合约（owner = 主工程测试钱包 0x90d0..., 有 setRisk/getRisk）
const CONTRACT = "0x29D2567bbD5979426fadAdB8991C10dE267f4304";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ABI = [
  "function setRisk(uint256 _score, string _reason) external",
  "function getRisk() view returns (uint256 score, string reason, uint256 updatedAt)",
  "event RiskUpdated(uint256 score, string reason, uint256 timestamp)",
];

// 是否配置了私钥（未配置则自动上链静默跳过，不影响 AI 风险分析主流程）
const onchainEnabled = !!PRIVATE_KEY;

let wallet, contract;
function init() {
  if (contract) return contract;
  if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY 未配置，自动上链已跳过");
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

// 从链上 RiskUpdated 事件日志重建历史（链上不可篡改的真相源）
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
