// Read Flare FTSO real-time prices for multiple assets (ethers connected to Coston2, with automatic RPC-pool fallback)
const { ethers } = require("ethers");
const { readCall } = require("./rpc-pool");

const REGISTRY = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019"; // universal across networks
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

// Single-asset price (symbol: XRP/BTC/ETH)
async function getPrice(symbol) {
  const id = FEEDS[symbol];
  if (!id) throw new Error("unsupported asset: " + symbol);
  return readFeed(id);
}

// Backward-compatible legacy interface
async function getXrpUsd() {
  return getPrice("XRP");
}

// Whole market: XRP + BTC + ETH (cross-asset contagion context)
async function getMarketContext() {
  const [xrp, btc, eth] = await Promise.all([getPrice("XRP"), getPrice("BTC"), getPrice("ETH")]);
  return { XRP: xrp.price, BTC: btc.price, ETH: eth.price, xrp: xrp.price, btc: btc.price, eth: eth.price, timestamp: xrp.timestamp };
}

module.exports = { getPrice, getXrpUsd, getMarketContext, FEEDS };
