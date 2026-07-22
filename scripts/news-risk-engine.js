// M4-② 杀手锏：AI 读突发新闻文本 → 抢先风控（已重构为策略框架）
// 核心卖点：传统清算只看价格（新闻刚出、价格没跌时它毫无反应）；
// AI 读懂非结构化新闻文本，能在价格反应前就预警风险 —— 规则/传统预言机做不到。
// 用法：node scripts/news-risk-engine.js "你的新闻文本"
const { analyze } = require("../lib/risk-analyzer");
const { updateSnapshot } = require("../lib/snapshot");
const newsStrategy = require("../risk-strategies/news-analysis");

const DEFAULT_NEWS =
  "BREAKING: US SEC announces a new formal investigation into Ripple over alleged unregistered securities sales. Several major exchanges are reportedly considering suspending XRP trading pending regulatory clarity.";

async function main() {
  const news = process.argv[2] || DEFAULT_NEWS;
  const price = 1.13; // 演示：价格还没跌

  console.log("场景：价格 $" + price + " 平稳，但一条突发新闻刚刚出现\n");
  console.log("突发新闻:\n  " + news + "\n");
  console.log("传统清算引擎（只看价格）→ 价格没跌，风险判定: 低（无反应）");

  console.log("\nAI 风控引擎读新闻中 (策略: " + newsStrategy.name + ")...");
  const risk = await analyze(newsStrategy, { news, price });
  console.log("AI 判定 → 风险分:", risk.score, "| 理由:", risk.reason);

  console.log("\n更新链上风险快照...");
  const snapshot = await updateSnapshot(risk);
  console.log("快照已更新:", JSON.stringify(snapshot));

  console.log("\n✅ 杀手锏演示：AI 读懂新闻文本，在价格反应前就把风险拉高。");
  console.log("   接着跑 MiniLendingDemo 会看到借贷协议因此进入保护（传统清算此刻还在放贷）。");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
