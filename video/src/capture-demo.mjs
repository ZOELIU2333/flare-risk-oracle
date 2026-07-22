import { createRequire } from "node:module";
import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const LIVE_URL = "https://flare-risk-oracle.onrender.com/";
const FDC_TX_URL = "https://coston2-explorer.flare.network/tx/0xe1aa6bf6d89a14422ce60af8646f8943676bcbc6de5c650a62ff3ea3268e69a7";
const ORACLE_URL = "https://coston2-explorer.flare.network/address/0x29D2567bbD5979426fadAdB8991C10dE267f4304";
const HEADLINE = "US SEC announces formal investigation into Ripple; exchanges consider suspending XRP trading.";
const OUTPUT_DIR = path.resolve("video/work/captures");
const VIEWPORT = { width: 1920, height: 1080 };

await mkdir(OUTPUT_DIR, { recursive: true });

async function warmService() {
  const started = Date.now();
  let lastError;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const response = await fetch(`${LIVE_URL}api/health`, {
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return Date.now() - started;
      lastError = new Error(`Health check failed: ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    console.log(`Warm-up attempt ${attempt} did not complete; retrying...`);
    await delay(4_000);
  }
  throw new Error("Unable to warm hosted demo", { cause: lastError });
}

async function installCaptureStyle(page) {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    document.body.style.cursor = "none";
    const cursor = document.createElement("div");
    cursor.id = "capture-pointer";
    cursor.style.cssText = [
      "position:fixed",
      "left:960px",
      "top:540px",
      "width:20px",
      "height:20px",
      "border:2px solid rgba(255,255,255,.96)",
      "background:rgba(61,230,134,.22)",
      "border-radius:50%",
      "box-shadow:0 2px 12px rgba(0,0,0,.45)",
      "transform:translate(-50%,-50%)",
      "transition:left .75s cubic-bezier(.22,.8,.25,1),top .75s cubic-bezier(.22,.8,.25,1),transform .18s ease",
      "z-index:2147483647",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(cursor);
  });
}

async function moveCursor(page, selector, press = false) {
  await page.evaluate(({ selector, press }) => {
    const target = document.querySelector(selector);
    const cursor = document.querySelector("#capture-pointer");
    if (!target || !cursor) return;
    const rect = target.getBoundingClientRect();
    cursor.style.left = `${rect.left + rect.width / 2}px`;
    cursor.style.top = `${rect.top + rect.height / 2}px`;
    cursor.style.transform = press
      ? "translate(-50%,-50%) scale(.72)"
      : "translate(-50%,-50%) scale(1)";
  }, { selector, press });
  await page.waitForTimeout(press ? 220 : 850);
}

async function scrollTo(page, selector, block = "center") {
  await page.evaluate(({ selector, block }) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block });
  }, { selector, block });
  await page.waitForTimeout(1_400);
}

async function waitForDashboard(page) {
  await page.locator("#scoreNum").waitFor({ state: "visible", timeout: 120_000 });
  await page.waitForFunction(
    () => {
      const score = document.querySelector("#scoreNum")?.textContent?.trim();
      const sources = document.querySelector("#aiSources")?.textContent || "";
      return /^\d+$/.test(score || "") && sources.includes("GPT-5.5") && sources.includes("Qwen3");
    },
    null,
    { timeout: 120_000 },
  );
}

async function createTake(browser, name, action) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT },
  });
  const page = await context.newPage();
  const video = page.video();
  let metadata = {};

  try {
    metadata = await action(page);
  } finally {
    await context.close();
  }

  const rawPath = await video.path();
  const outputPath = path.join(OUTPUT_DIR, `${name}.webm`);
  await rename(rawPath, outputPath);
  return { name, file: outputPath, ...metadata };
}

async function openProduct(page) {
  await page.goto(LIVE_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForDashboard(page);
  await installCaptureStyle(page);
}

const warmupMs = await warmService();
const browser = await chromium.launch({ headless: true });
const takes = [];

try {
  takes.push(await createTake(browser, "01-hero", async (page) => {
    await openProduct(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(5_500);
    return { url: page.url() };
  }));

  takes.push(await createTake(browser, "02-dashboard", async (page) => {
    await openProduct(page);
    await scrollTo(page, "#dashboard", "start");
    await page.waitForTimeout(6_500);
    const values = await page.evaluate(() => ({
      price: document.querySelector("#xrpPrice")?.textContent?.trim(),
      score: document.querySelector("#scoreNum")?.textContent?.trim(),
      agreement: document.querySelector("#agreement")?.textContent?.trim(),
      spread: document.querySelector("#divergenceLabel")?.textContent?.trim(),
    }));
    return values;
  }));

  takes.push(await createTake(browser, "03-shock-test", async (page) => {
    await openProduct(page);
    await scrollTo(page, "#newsInput", "center");
    await page.waitForTimeout(1_500);
    await moveCursor(page, "#newsInput");
    await page.locator("#newsInput").fill(HEADLINE);
    await page.waitForTimeout(1_200);
    await moveCursor(page, "#analyzeNewsBtn");
    await moveCursor(page, "#analyzeNewsBtn", true);
    await page.locator("#analyzeNewsBtn").click();
    await moveCursor(page, "#analyzeNewsBtn");

    await page.waitForFunction(
      () => /^\d+$/.test(document.querySelector("#newsScore")?.textContent?.trim() || ""),
      null,
      { timeout: 120_000 },
    );
    await page.waitForTimeout(6_000);

    const result = await page.evaluate(() => ({
      price: document.querySelector("#xrpPrice")?.textContent?.trim(),
      headline: document.querySelector("#newsInput")?.value,
      newsScore: document.querySelector("#newsScore")?.textContent?.trim(),
      newsReason: document.querySelector("#newsReason")?.innerText?.trim(),
      legacy: "low",
    }));
    const providers = ["GPT-5.5", "Claude Opus 4.8", "DeepSeek", "Qwen3-235B"];
    const missing = providers.filter((provider) => !result.newsReason.includes(provider));
    if (missing.length) throw new Error(`Shock take missing providers: ${missing.join(", ")}`);
    return result;
  }));

  takes.push(await createTake(browser, "04-architecture", async (page) => {
    await openProduct(page);
    await scrollTo(page, "#flow", "center");
    await page.waitForTimeout(7_000);
    return { url: `${LIVE_URL}#flow` };
  }));

  takes.push(await createTake(browser, "05-onchain", async (page) => {
    await openProduct(page);
    await scrollTo(page, "#onchain", "center");
    await page.waitForTimeout(7_000);
    const values = await page.evaluate(() => ({
      transaction: document.querySelector("#ocTx")?.textContent?.trim(),
      transactionUrl: document.querySelector("#ocTx")?.href,
      historyCount: document.querySelector("#ocHistCount")?.textContent?.trim(),
    }));
    return values;
  }));

  takes.push(await createTake(browser, "06-ecosystem", async (page) => {
    await openProduct(page);
    await scrollTo(page, "#ecosystem", "center");
    await page.waitForTimeout(7_000);
    return { url: `${LIVE_URL}#ecosystem` };
  }));

  takes.push(await createTake(browser, "07-fdc-explorer", async (page) => {
    await page.goto(FDC_TX_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForTimeout(10_000);
    return { url: page.url(), title: await page.title() };
  }));

  takes.push(await createTake(browser, "08-oracle-explorer", async (page) => {
    await page.goto(ORACLE_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForTimeout(10_000);
    return { url: page.url(), title: await page.title() };
  }));
} finally {
  await browser.close();
}

const manifest = {
  capturedAt: new Date().toISOString(),
  warmupMs,
  liveUrl: LIVE_URL,
  fdcTransactionUrl: FDC_TX_URL,
  takes,
};

await writeFile(
  path.resolve("video/work/capture-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(JSON.stringify(manifest, null, 2));
