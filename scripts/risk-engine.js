// M3/M4 市场风控引擎（已重构为策略框架）
// 流程：拉 XRP 实时数据 → 用 market-analysis 策略调 Kimi → 更新 npoint 快照(FDC 数据源)
// 个人项目：公开大模型 API、公开数据源、全新代码。不涉及任何公司资产。
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
      if (attempt === 3) throw new Error(`CoinGecko 失败(重试后): ${e.message}`);
      console.log("   CoinGecko 超时，重试...");
    }
  }
}

async function main() {
  console.log("① 拉取 XRP 市场数据...");
  const market = await fetchMarketData();
  console.log("   价格 $" + market.price + " | 24h " + market.change24h.toFixed(2) + "%");

  console.log("② Kimi 多维分析风险 (策略: " + marketStrategy.name + ")...");
  const risk = await analyze(marketStrategy, market);
  console.log("   市场风险:", risk.dimensions.marketRisk, "| 波动风险:", risk.dimensions.volatilityRisk, "| 流动性风险:", risk.dimensions.liquidityRisk);
  console.log("   综合风险分:", risk.score, "| 理由:", risk.reason);

  console.log("③ 更新链下快照(FDC 数据源)...");
  const snapshot = await updateSnapshot(risk);
  console.log("   快照已更新:", JSON.stringify(snapshot));

  console.log("\n✅ 市场风控引擎跑完。下一步跑 FDC 上链脚本把这个快照可信上链：");
  console.log("   cd _reference-starter && yarn hardhat run scripts/fdcExample/RiskWeb2Json.ts --network coston2");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
