const { Readable } = require("stream");

const DEFAULT_VIDEO_URL =
  "https://github.com/ZOELIU2333/flare-risk-oracle/releases/download/" +
  "video-v1.0.0/RiskOracle-Flare-Summer-Signal.mp4";

const FORWARDED_HEADERS = [
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
];

function isSingleByteRange(value) {
  if (!value) return true;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  return Boolean(match && (match[1] || match[2]));
}

function createVideoHandler({
  videoUrl = process.env.DEMO_VIDEO_URL || DEFAULT_VIDEO_URL,
  fetchImpl = fetch,
  connectTimeoutMs = 15000,
} = {}) {
  return async function streamDemoVideo(req, res) {
    const range = req.get("range");
    if (!isSingleByteRange(range)) {
      return res.status(416).set("Accept-Ranges", "bytes").end();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), connectTimeoutMs);

    let upstream;
    try {
      const headers = range ? { Range: range } : {};
      upstream = await fetchImpl(videoUrl, {
        method: req.method,
        headers,
        redirect: "follow",
        signal: controller.signal,
      });
    } catch (error) {
      const message = error.name === "AbortError" ? "Video source timed out" : "Video source unavailable";
      return res.status(502).type("text/plain").send(message);
    } finally {
      clearTimeout(timeout);
    }

    if (upstream.status === 416) {
      const contentRange = upstream.headers.get("content-range");
      if (contentRange) res.set("Content-Range", contentRange);
      await upstream.body?.cancel();
      return res.status(416).set("Accept-Ranges", "bytes").end();
    }

    if (upstream.status !== 200 && upstream.status !== 206) {
      await upstream.body?.cancel();
      return res.status(502).type("text/plain").send("Video source unavailable");
    }

    res.status(upstream.status);
    res.set("Content-Type", "video/mp4");
    res.set("Content-Disposition", 'inline; filename="RiskOracle-Flare-Summer-Signal.mp4"');
    res.set("Cache-Control", "public, max-age=3600");
    for (const header of FORWARDED_HEADERS) {
      const value = upstream.headers.get(header);
      if (value) res.set(header, value);
    }

    if (req.method === "HEAD") {
      await upstream.body?.cancel();
      return res.end();
    }

    if (!upstream.body) {
      return res.status(502).type("text/plain").send("Video source unavailable");
    }

    const body = Readable.fromWeb(upstream.body);
    res.on("close", () => body.destroy());
    body.on("error", () => {
      if (!res.headersSent) res.status(502).end("Video stream interrupted");
      else res.destroy();
    });
    body.pipe(res);
  };
}

function mountVideoRoutes(app, options) {
  const handler = createVideoHandler(options);
  app.head("/media/demo.mp4", handler);
  app.get("/media/demo.mp4", handler);
}

module.exports = {
  DEFAULT_VIDEO_URL,
  createVideoHandler,
  isSingleByteRange,
  mountVideoRoutes,
};
