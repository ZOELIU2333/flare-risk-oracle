// 读取 Flare FTSO 多资产实时价格（用 ethers 连 Coston2，走 RPC 池自动降级）
const { ethers } = require("ethers");
const { readCall } = require("./rpc-pool");

const REGISTRY = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019"; // 全网通用
const FEEDS = {
  XRP: "0x015852502f55534400000000000000000000000000",
  BTC: "0x014254432f55534400000000000000000000000000",
  ETH: "0x014554482f55534400000000000000000000000000",
};

const REGISTRY_ABI = ["function getContractAddressByName(string) view returns (address)"];
const FTSO_ABI = ["function getFeedById(bytes21) view returns (uint256, int8, uint64)"];

async function readFeed(id) {
  return readCall(async (provider) => {
    const registry = new ethers.Contract(REGISTRY, REGISTRY_ABI, provider);
    const ftsoAddr = await registry.getContractAddressByName("FtsoV2");
    const ftso = new ethers.Contract(ftsoAddr, FTSO_ABI, provider);
    const [value, decimals, timestamp] = await ftso.getFeedById(id);
    return { price: Number(value) / 10 ** Number(decimals), decimals: Number(decimals), timestamp: Number(timestamp) };
  });
}

// 单资产价格（symbol: XRP/BTC/ETH）
async function getPrice(symbol) {
  const id = FEEDS[symbol];
  if (!id) throw new Error("unsupported asset: " + symbol);
  return readFeed(id);
}

// 兼容旧接口
async function getXrpUsd() {
  return getPrice("XRP");
}

// 全市场：XRP + BTC + ETH（跨资产传染上下文）
async function getMarketContext() {
  const [xrp, btc, eth] = await Promise.all([getPrice("XRP"), getPrice("BTC"), getPrice("ETH")]);
  return { XRP: xrp.price, BTC: btc.price, ETH: eth.price, xrp: xrp.price, btc: btc.price, eth: eth.price, timestamp: xrp.timestamp };
}

module.exports = { getPrice, getXrpUsd, getMarketContext, FEEDS };
