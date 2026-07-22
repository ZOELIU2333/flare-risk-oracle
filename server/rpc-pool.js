// RPC 池 + 自动降级：多个 Coston2 端点，一个挂了自动换下一个，解决公共 RPC 限额/不稳。
const { ethers } = require("ethers");

// 读操作用的 RPC 池（官方 + Ankr + 其他公共）；顺序 = 优先级
const READ_RPCS = [
  "https://coston2-api.flare.network/ext/C/rpc",
  "https://rpc.ankr.com/flare_coston2",
];
// getLogs 专用池（官方的 getLogs 不稳，Ankr 优先）
const LOGS_RPCS = [
  "https://rpc.ankr.com/flare_coston2",
  "https://coston2-api.flare.network/ext/C/rpc",
];

function makeProvider(url) {
  return new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
}

// 在一组 RPC 上依次尝试 fn，直到成功；全失败才抛
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
