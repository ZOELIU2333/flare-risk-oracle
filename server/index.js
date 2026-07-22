// AI Risk Oracle 后端 API 服务（三资产 · 多AI共识 · 缓存 · 自动上链 · 链上历史）
// key 安全留后端；前端只调本服务。后台定时对 XRP/BTC/ETH 各跑多AI共识并缓存，前端读缓存秒回。
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const { analyzeMultiAI } = require("../lib/risk-analyzer");
const ftsoStrategy = require("../risk-strategies/ftso-live-analysis");
const newsStrategy = require("../risk-strategies/news-analysis");
const { getPrice, getMarketContext } = require("./ftso");
const { pushRisk, CONTRACT, readOnchainHistory } = require("./onchain");

const ASSETS = ["XRP", "BTC", "ETH"];
const MAX_HISTORY = 20;

// 轻量持久化：各资产历史落盘（重启不丢）
const DATA_DIR = path.join(__dirname, "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json"); // { XRP:[...], BTC:[...], ETH:[...] }
function loadHistory() {
  try {
    const raw = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    if (Array.isArray(raw)) return { XRP: raw, BTC: [], ETH: [] }; // 兼容旧格式(纯数组=XRP)
    return { XRP: raw.XRP || [], BTC: raw.BTC || [], ETH: raw.ETH || [] };
  } catch {
    return { XRP: [], BTC: [], ETH: [] };
  }
}
function saveHistory(hist) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(hist, null, 2));
  } catch (e) {
    console.error("[history] save failed:", e.message);
  }
}

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
// 同源托管前端静态文件（部署时一个服务同时给页面 + API）
app.use(express.static(path.join(__dirname, "..", "frontend")));

// 各资产的风险缓存 + 历史
const riskCaches = { XRP: { status: "initializing", updatedAt: 0 }, BTC: { status: "initializing", updatedAt: 0 }, ETH: { status: "initializing", updatedAt: 0 } };
let riskHistory = loadHistory();
let refreshing = false;

// 对单个资产跑一次多AI分析并更新缓存
async function refreshAsset(symbol, mkt) {
  const price = mkt[symbol];
  const others = ASSETS.filter((a) => a !== symbol);
  // 传入主资产价 + 其余资产作大盘上下文 + 该资产的趋势历史
  const hist = riskHistory[symbol] || [];
  const trend = hist.slice(-5).map((h) => h.score);
  const ctx = { price, asset: symbol, trend };
  others.forEach((a) => { ctx[a.toLowerCase()] = mkt[a]; });

  // 兜底：某 AI 这次失败时用该资产上次成功的该 AI 结果补上（保证面板总有两个 AI）
  const lastSources = (riskCaches[symbol]?.sources) || [];
  const fallback = {};
  lastSources.forEach((s) => { fallback[s.provider] = s; });

  const risk = await analyzeMultiAI(ftsoStrategy, ctx, fallback);
  const now = Math.floor(Date.now() / 1000);

  hist.push({ score: risk.score, price, at: now, agreement: risk.agreement, sources: risk.sources });
  if (hist.length > MAX_HISTORY) hist.shift();
  riskHistory[symbol] = hist;

  const prev = riskCaches[symbol] || {};
  riskCaches[symbol] = {
    status: "ok",
    asset: symbol,
    price,
    market: Object.fromEntries(others.map((a) => [a, mkt[a]])),
    score: risk.score,
    reason: risk.reason,
    agreement: risk.agreement,
    divergence: risk.divergence,
    dimensions: risk.dimensions,
    sources: risk.sources,
    trend: hist.map((h) => h.score),
    history: hist.map((h) => ({ score: h.score, at: h.at, sources: h.sources })),
    onchain: prev.onchain || (symbol === "XRP" ? { contract: CONTRACT } : null),
    updatedAt: now,
  };
  console.log(`[risk:${symbol}] score=${risk.score} agreement=${risk.agreement} (${risk.sources.map(s=>s.provider+':'+s.score).join(', ')})`);

  // 仅主资产 XRP 自动上链（链上主推；BTC/ETH 展示分析但不都占用 gas）
  if (symbol === "XRP") {
    pushRisk(risk.score, risk.reason)
      .then((res) => {
        if (!res) return; // 未配置私钥，自动上链已跳过
        riskCaches.XRP.onchain = { contract: res.contract, txHash: res.txHash, at: Math.floor(Date.now() / 1000) };
        console.log(`[onchain] pushed XRP score=${risk.score} tx=${res.txHash}`);
      })
      .catch((e) => console.error("[onchain] push failed:", e.message));
  }
}

// 后台刷新所有资产（串行，避免同时打爆 AI）
async function refreshAll() {
  if (refreshing) return;
  refreshing = true;
  try {
    const mkt = await getMarketContext(); // { XRP, BTC, ETH }
    for (let i = 0; i < ASSETS.length; i++) {
      const sym = ASSETS[i];
      try { await refreshAsset(sym, mkt); }
      catch (e) { console.error(`[risk:${sym}] failed:`, e.message); }
      // 资产间隔：中转对 Claude 有每分钟 token 限流，错开到不同分钟窗口避免撞限流
      if (i < ASSETS.length - 1) await new Promise((r) => setTimeout(r, 40000));
    }
    saveHistory(riskHistory);
  } finally {
    refreshing = false;
  }
}

app.get("/api/health", (req, res) => res.json({ ok: true, assets: ASSETS }));

// 风险：按资产返回缓存（?asset=XRP|BTC|ETH，默认 XRP）
app.get("/api/risk", (req, res) => {
  const asset = (req.query.asset || "XRP").toUpperCase();
  res.json(riskCaches[asset] || { status: "error", error: "unknown asset" });
});

// 所有资产的概览（顶部切换器/概览用）
app.get("/api/overview", (req, res) => {
  res.json(ASSETS.map((a) => ({
    asset: a,
    status: riskCaches[a].status,
    price: riskCaches[a].price,
    score: riskCaches[a].score,
    agreement: riskCaches[a].agreement,
  })));
});

// 链上历史真相源（从 RiskOracle 事件日志重建，仅 XRP 上链）
let ocHistCache = { at: 0, data: [] };
app.get("/api/onchain-history", async (req, res) => {
  try {
    const now = Date.now();
    if (now - ocHistCache.at < 60000 && ocHistCache.data.length) {
      return res.json({ source: "on-chain events", contract: CONTRACT, cached: true, history: ocHistCache.data });
    }
    const h = await readOnchainHistory();
    ocHistCache = { at: now, data: h };
    res.json({ source: "on-chain events", contract: CONTRACT, cached: false, history: h });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/price", async (req, res) => {
  try { res.json(await getPrice((req.query.asset || "XRP").toUpperCase())); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/risk/refresh", (req, res) => {
  refreshAll();
  res.json({ triggered: true });
});

// 杀手锏：新闻分析（针对指定资产，默认 XRP）
app.post("/api/news", async (req, res) => {
  try {
    const news = (req.body && req.body.news) || "";
    const asset = ((req.body && req.body.asset) || "XRP").toUpperCase();
    if (!news.trim()) return res.status(400).json({ error: "news required" });
    const p = await getPrice(asset);
    const risk = await analyzeMultiAI(newsStrategy, { news, price: p.price, asset });
    res.json({ asset, price: p.price, score: risk.score, reason: risk.reason, agreement: risk.agreement, sources: risk.sources });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 8078;
app.listen(PORT, () => {
  console.log(`AI Risk Oracle API on http://localhost:${PORT} · assets: ${ASSETS.join(", ")}`);
  // 从磁盘历史恢复各资产缓存（重启秒有数据）
  for (const sym of ASSETS) {
    const hist = riskHistory[sym] || [];
    if (hist.length) {
      const h = hist[hist.length - 1];
      riskCaches[sym] = {
        status: "ok", asset: sym, price: h.price, score: h.score,
        reason: h.sources?.[0]?.reason || "", agreement: h.agreement, dimensions: {},
        sources: h.sources || [], trend: hist.map((x) => x.score),
        history: hist.map((x) => ({ score: x.score, at: x.at, sources: x.sources })),
        onchain: sym === "XRP" ? { contract: CONTRACT } : null,
        updatedAt: h.at,
      };
    }
  }
  console.log(`[history] restored: ${ASSETS.map(a => a + ':' + (riskHistory[a]?.length || 0)).join(', ')}`);
  refreshAll();
  setInterval(refreshAll, 6 * 60 * 1000); // 每6分钟刷新全部资产
});
