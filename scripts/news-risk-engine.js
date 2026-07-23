// M4-② Killer feature: AI reads breaking-news text → proactive risk control (refactored into a strategy framework)
// Core value: traditional liquidation only watches price (it does nothing when news just broke but price hasn't dropped yet);
// AI comprehends unstructured news text and can flag risk before price reacts — something rule-based / traditional oracles can't do.
// Usage: node scripts/news-risk-engine.js "your news text"
const { analyze } = require("../lib/risk-analyzer");
const { updateSnapshot } = require("../lib/snapshot");
const newsStrategy = require("../risk-strategies/news-analysis");

const DEFAULT_NEWS =
  "BREAKING: US SEC announces a new formal investigation into Ripple over alleged unregistered securities sales. Several major exchanges are reportedly considering suspending XRP trading pending regulatory clarity.";

async function main() {
  const news = process.argv[2] || DEFAULT_NEWS;
  const price = 1.13; // Demo: price hasn't dropped yet

  console.log("Scenario: price $" + price + " is stable, but a breaking news headline just appeared\n");
  console.log("Breaking news:\n  " + news + "\n");
  console.log("Traditional liquidation engine (price-only) → price hasn't dropped, risk verdict: low (no reaction)");

  console.log("\nAI risk engine reading the news (strategy: " + newsStrategy.name + ")...");
  const risk = await analyze(newsStrategy, { news, price });
  console.log("AI verdict → risk score:", risk.score, "| reason:", risk.reason);

  console.log("\nUpdating the on-chain risk snapshot...");
  const snapshot = await updateSnapshot(risk);
  console.log("Snapshot updated:", JSON.stringify(snapshot));

  console.log("\n✅ Killer-feature demo: AI comprehends the news text and raises risk before price reacts.");
  console.log("   Running MiniLendingDemo next shows the lending protocol entering protection mode as a result (traditional liquidation is still lending at this point).");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
