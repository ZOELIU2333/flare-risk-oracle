// AI Risk Oracle backend API service (three assets · multi-AI consensus · cache · auto on-chain push · on-chain history)
// Keys stay safely on the backend; the frontend only calls this service. A background job periodically runs multi-AI consensus for XRP/BTC/ETH and caches the results, so the frontend reads the cache and responds instantly.
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const { analyzeMultiAI } = require("../lib/risk-analyzer");
const ftsoStrategy = require("../risk-strategies/ftso-live-analysis");
const newsStrategy = require("../risk-strategies/news-analysis");
const { getPrice, getMarketContext } = require("./ftso");
const { pushRisk, CONTRACT, readOnchainHistory } = require("./onchain");
const { mountVideoRoutes } = require("./video-stream");

const ASSETS = ["XRP", "BTC", "ETH"];
const MAX_HISTORY = 20;

// Lightweight persistence: each asset's history is written to disk (survives restarts)
const DATA_DIR = path.join(__dirname, "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json"); // { XRP:[...], BTC:[...], ETH:[...] }
const SEED_FILE = path.join(__dirname, "seed-history.json"); // committed seed history, loaded as fallback on cold start / when no runtime data exists
function loadSeed() {
  try {
    const s = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
    return { XRP: s.XRP || [], BTC: s.BTC || [], ETH: s.ETH || [] };
  } catch {
    return { XRP: [], BTC: [], ETH: [] };
  }
}
function loadHistory() {
  try {
    const raw = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    const h = Array.isArray(raw)
      ? { XRP: raw, BTC: [], ETH: [] } // backward-compatible with the old format (plain array = XRP)
      : { XRP: raw.XRP || [], BTC: raw.BTC || [], ETH: raw.ETH || [] };
    // For assets with no runtime data, fill in from the seed (so the trend chart is populated right after a cold start)
    const seed = loadSeed();
    for (const a of ["XRP", "BTC", "ETH"]) if (!h[a].length) h[a] = seed[a];
    return h;
  } catch {
    return loadSeed();
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
// Serve the frontend static files from the same origin (in deployment, one service serves both the page and the API)
app.use(express.static(path.join(__dirname, "..", "frontend")));
mountVideoRoutes(app);

// Per-asset risk cache + history
const riskCaches = { XRP: { status: "initializing", updatedAt: 0 }, BTC: { status: "initializing", updatedAt: 0 }, ETH: { status: "initializing", updatedAt: 0 } };
let riskHistory = loadHistory();
let refreshing = false;

// Run one round of multi-AI analysis for a single asset and update its cache
async function refreshAsset(symbol, mkt) {
  const price = mkt[symbol];
  const others = ASSETS.filter((a) => a !== symbol);
  // Pass the primary asset price + the other assets as market context + this asset's trend history
  const hist = riskHistory[symbol] || [];
  const trend = hist.slice(-5).map((h) => h.score);
  const ctx = { price, asset: symbol, trend };
  others.forEach((a) => { ctx[a.toLowerCase()] = mkt[a]; });

  // Fallback: if an AI fails this round, reuse that asset's last successful result from the same AI (ensures the panel always shows two AIs)
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

  // Only the primary asset XRP is pushed on-chain automatically (main on-chain feed; BTC/ETH are analyzed and displayed but do not each consume gas)
  if (symbol === "XRP") {
    pushRisk(risk.score, risk.reason)
      .then((res) => {
        if (!res) return; // no private key configured, auto on-chain push skipped
        riskCaches.XRP.onchain = { contract: res.contract, txHash: res.txHash, at: Math.floor(Date.now() / 1000) };
        console.log(`[onchain] pushed XRP score=${risk.score} tx=${res.txHash}`);
      })
      .catch((e) => console.error("[onchain] push failed:", e.message));
  }
}

// Background refresh of all assets (serial, to avoid overloading the AI at once)
async function refreshAll() {
  if (refreshing) return;
  refreshing = true;
  try {
    const mkt = await getMarketContext(); // { XRP, BTC, ETH }
    for (let i = 0; i < ASSETS.length; i++) {
      const sym = ASSETS[i];
      try { await refreshAsset(sym, mkt); }
      catch (e) { console.error(`[risk:${sym}] failed:`, e.message); }
      // Gap between assets: the relay applies a per-minute token rate limit for Claude, so stagger into different minute windows to avoid hitting it
      if (i < ASSETS.length - 1) await new Promise((r) => setTimeout(r, 40000));
    }
    saveHistory(riskHistory);
  } finally {
    refreshing = false;
  }
}

app.get("/api/health", (req, res) => res.json({ ok: true, assets: ASSETS }));

// Risk: return the cache for a given asset (?asset=XRP|BTC|ETH, defaults to XRP)
app.get("/api/risk", (req, res) => {
  const asset = (req.query.asset || "XRP").toUpperCase();
  res.json(riskCaches[asset] || { status: "error", error: "unknown asset" });
});

// Overview of all assets (used by the top switcher / overview)
app.get("/api/overview", (req, res) => {
  res.json(ASSETS.map((a) => ({
    asset: a,
    status: riskCaches[a].status,
    price: riskCaches[a].price,
    score: riskCaches[a].score,
    agreement: riskCaches[a].agreement,
  })));
});

// On-chain history source of truth (rebuilt from RiskOracle event logs; only XRP is pushed on-chain)
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

// Killer feature: news analysis (for a given asset, defaults to XRP)
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
  // Restore each asset's cache from on-disk history (data available instantly after a restart)
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
  setInterval(refreshAll, 6 * 60 * 1000); // refresh all assets every 6 minutes
});
