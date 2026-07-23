// M3/M4 market risk engine (refactored into a strategy framework)
// Flow: fetch live XRP data → score with Kimi via the market-analysis strategy → update the npoint snapshot (FDC data source)
// Personal project: public LLM APIs, public data sources, all-new code. Involves no company assets.
const { analyze } = require("../lib/risk-analyzer");
const { updateSnapshot } = require("../lib/snapshot");
const marketStrategy = require("../risk-strategies/market-analysis");

async function fetchMarketData() {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      return {
        price: d.ripple.usd,
        change24h: d.ripple.usd_24h_change,
        volume24h: d.ripple.usd_24h_vol,
      };
    } catch (e) {
      if (attempt === 3) throw new Error(`CoinGecko failed (after retries): ${e.message}`);
      console.log("   CoinGecko timed out, retrying...");
    }
  }
}

async function main() {
  console.log("① Fetching XRP market data...");
  const market = await fetchMarketData();
  console.log("   price $" + market.price + " | 24h " + market.change24h.toFixed(2) + "%");

  console.log("② Kimi multi-dimensional risk analysis (strategy: " + marketStrategy.name + ")...");
  const risk = await analyze(marketStrategy, market);
  console.log("   market risk:", risk.dimensions.marketRisk, "| volatility risk:", risk.dimensions.volatilityRisk, "| liquidity risk:", risk.dimensions.liquidityRisk);
  console.log("   composite risk score:", risk.score, "| reason:", risk.reason);

  console.log("③ Updating the off-chain snapshot (FDC data source)...");
  const snapshot = await updateSnapshot(risk);
  console.log("   Snapshot updated:", JSON.stringify(snapshot));

  console.log("\n✅ Market risk engine finished. Next, run the FDC on-chain script to attest this snapshot on-chain:");
  console.log("   cd _reference-starter && yarn hardhat run scripts/fdcExample/RiskWeb2Json.ts --network coston2");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
