// 生成种子历史 server/seed-history.json：调真实四模型为 XRP/BTC/ETH 各生成 N 条历史，
// 时间戳按 6 分钟递减铺开（模拟过去 N*6 分钟），供线上冷启动加载，让趋势图一打开即丰满。
// 数据为真实模型输出 + 真实 FTSO 价格，仅时间戳为生成时刻回填。
// 用法: node scripts/gen-seed-history.js [每资产条数,默认20]
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { getMarketContext } = require("../server/ftso");
const { analyzeMultiAI } = require("../lib/risk-analyzer");
const ftsoStrategy = require("../risk-strategies/ftso-live-analysis");

const ASSETS = ["XRP", "BTC", "ETH"];
const N = parseInt(process.argv[2] || "20", 10);
const STEP = 6 * 60; // 6 分钟/条，与线上刷新周期一致
const SEED_FILE = path.join(__dirname, "..", "server", "seed-history.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const seed = { XRP: [], BTC: [], ETH: [] };
  const nowSec = Math.floor(Date.now() / 1000);
  const startAt = nowSec - N * STEP; // 最早一条的时间

  // 每个资产维护一份滚动 fallback（缺模型时用该资产上一条兜底）
  const lastSources = { XRP: [], BTC: [], ETH: [] };

  for (let i = 0; i < N; i++) {
    const mkt = await getMarketContext();
    // 三资产串行（错开 Claude 请求），条内逐个
    for (let a = 0; a < ASSETS.length; a++) {
      const sym = ASSETS[a];
      const hist = seed[sym];
      const trend = hist.slice(-5).map((h) => h.score);
      const ctx = { price: mkt[sym], asset: sym, trend };
      ASSETS.filter((x) => x !== sym).forEach((x) => { ctx[x.toLowerCase()] = mkt[x]; });

      const fallback = {};
      lastSources[sym].forEach((s) => { fallback[s.provider] = s; });

      try {
        const risk = await analyzeMultiAI(ftsoStrategy, ctx, fallback);
        lastSources[sym] = risk.sources;
        const at = startAt + i * STEP;
        hist.push({
          score: risk.score,
          price: mkt[sym],
          at,
          agreement: risk.agreement,
          sources: risk.sources,
        });
        console.log(`[${i + 1}/${N}] ${sym} score=${risk.score} models=${risk.sources.length}`);
      } catch (e) {
        console.warn(`[${i + 1}/${N}] ${sym} failed: ${e.message.slice(0, 60)}`);
      }
      await sleep(15000); // 每次调用后 15s，避开 Claude 每分钟 token 限流
    }
  }

  fs.writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2));
  console.log(`\n✅ 写入 ${SEED_FILE}`);
  ASSETS.forEach((a) => console.log(`  ${a}: ${seed[a].length} 条`));
})();
