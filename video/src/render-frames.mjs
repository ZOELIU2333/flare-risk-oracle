import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { once } from "node:events";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = resolve(new URL("../..", import.meta.url).pathname);
const outputDir = join(root, "video/work/motion");
const fps = 30;
const durationArg = process.argv.find((value) => value.startsWith("--seconds="));
const duration = durationArg ? Number(durationArg.split("=")[1]) : 98;
const output = join(outputDir, durationArg ? `picture-test-${duration}s.mp4` : "picture-master-hq.mp4");
const totalFrames = Math.round(duration * fps);
mkdirSync(outputDir, { recursive: true });

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
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
const browser = await chromium.launch({ headless: true, args: ["--hide-scrollbars", "--force-device-scale-factor=1"] });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await context.newPage();
await page.goto(`http://127.0.0.1:${port}/video/src/movie.html`, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__movieReady === true);
const cdp = await context.newCDPSession(page);

const ffmpeg = spawn("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", String(fps), "-i", "-",
  "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-g", "60", "-movflags", "+faststart",
  output
], { stdio: ["pipe", "inherit", "inherit"] });

try {
  for (let frame = 0; frame < totalFrames; frame += 1) {
    await page.evaluate((seconds) => window.seekMovie(seconds), frame / fps);
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "jpeg",
      quality: 96,
      fromSurface: true,
      captureBeyondViewport: false,
      optimizeForSpeed: true
    });
    if (!ffmpeg.stdin.write(Buffer.from(data, "base64"))) await once(ffmpeg.stdin, "drain");
    if (frame % 300 === 0) process.stdout.write(`Rendered ${frame}/${totalFrames} frames\n`);
  }
  ffmpeg.stdin.end();
  const [exitCode] = await once(ffmpeg, "exit");
  if (exitCode !== 0) throw new Error(`ffmpeg exited with code ${exitCode}`);
  process.stdout.write(`Rendered ${totalFrames} crisp frames to ${output}\n`);
} finally {
  await context.close();
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
