import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = resolve(new URL("../..", import.meta.url).pathname);
const workDir = join(root, "video/work/motion");
const previewDir = join(root, "video/work/verification-v2");
mkdirSync(workDir, { recursive: true });
mkdirSync(previewDir, { recursive: true });

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  const file = join(root, pathname === "/" ? "video/src/movie.html" : pathname.replace(/^\//, ""));
  if (!file.startsWith(root) || !existsSync(file)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(file).pipe(response);
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const { port } = server.address();
const browser = await chromium.launch({ headless: true, args: ["--hide-scrollbars", "--disable-infobars"] });

async function capturePreviews() {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}/video/src/movie.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__movieReady === true);
  const times = [0.25, 0.7, 1.15, 1.6, 2.6, 7.6, 15.6, 18.6, 21.9, 22.48, 22.8, 26.6, 32.6, 36.6, 44.6, 53.6, 65.6, 71.6, 79.6, 87.6, 93.6, 98.2];
  for (const time of times) {
    await page.evaluate((value) => window.seekMovie(value), time);
    await page.screenshot({ path: join(previewDir, `frame-${String(time).replace(".", "-")}.png`) });
  }
  await context.close();
}

async function recordMovie() {
  const contextCreatedAt = Date.now();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: { dir: workDir, size: { width: 1920, height: 1080 } }
  });
  const page = await context.newPage();
  const video = page.video();
  await page.goto(`http://127.0.0.1:${port}/video/src/movie.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__movieReady === true);
  const movieStartedAt = Date.now();
  await page.evaluate(() => window.startMovie());
  await page.waitForFunction(() => window.__movieFinished === true, null, { timeout: 115000 });
  await page.waitForTimeout(250);
  await context.close();
  const generatedPath = await video.path();
  const outputPath = join(workDir, "movie-raw.webm");
  renameSync(generatedPath, outputPath);
  const manifest = {
    outputPath,
    movieDuration: 98.6,
    startupOffset: Number(((movieStartedAt - contextCreatedAt) / 1000).toFixed(3)),
    recordedAt: new Date().toISOString()
  };
  writeFileSync(join(workDir, "recording.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

try {
  if (process.argv.includes("--preview")) await capturePreviews();
  else await recordMovie();
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
