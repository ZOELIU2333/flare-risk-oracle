const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");
const { mountVideoRoutes } = require("../server/video-stream");

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

function close(server) {
  return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

async function createFixture() {
  const seen = [];
  const upstream = http.createServer((req, res) => {
    seen.push({ method: req.method, range: req.headers.range });
    if (req.url === "/fail") {
      res.writeHead(500).end("nope");
      return;
    }

    const payload = Buffer.from("0123456789");
    if (req.headers.range === "bytes=2-5") {
      res.writeHead(206, {
        "Accept-Ranges": "bytes",
        "Content-Range": "bytes 2-5/10",
        "Content-Length": "4",
      });
      if (req.method === "HEAD") res.end();
      else res.end(payload.subarray(2, 6));
      return;
    }

    res.writeHead(200, {
      "Accept-Ranges": "bytes",
      "Content-Length": String(payload.length),
      ETag: '"demo"',
    });
    if (req.method === "HEAD") res.end();
    else res.end(payload);
  });
  const upstreamPort = await listen(upstream);

  const app = express();
  mountVideoRoutes(app, { videoUrl: `http://127.0.0.1:${upstreamPort}/video` });
  const proxy = http.createServer(app);
  const proxyPort = await listen(proxy);

  return {
    baseUrl: `http://127.0.0.1:${proxyPort}`,
    seen,
    async cleanup() {
      await close(proxy);
      await close(upstream);
    },
  };
}

test("streams one requested byte range inline", async () => {
  const fixture = await createFixture();
  try {
    const response = await fetch(`${fixture.baseUrl}/media/demo.mp4`, {
      headers: { Range: "bytes=2-5" },
    });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("content-type"), "video/mp4");
    assert.match(response.headers.get("content-disposition"), /^inline;/);
    assert.equal(response.headers.get("content-range"), "bytes 2-5/10");
    assert.equal(await response.text(), "2345");
    assert.equal(fixture.seen.at(-1).range, "bytes=2-5");
  } finally {
    await fixture.cleanup();
  }
});

test("supports metadata-only HEAD requests", async () => {
  const fixture = await createFixture();
  try {
    const response = await fetch(`${fixture.baseUrl}/media/demo.mp4`, { method: "HEAD" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-length"), "10");
    assert.equal(response.headers.get("accept-ranges"), "bytes");
    assert.equal(await response.text(), "");
    assert.equal(fixture.seen.at(-1).method, "HEAD");
  } finally {
    await fixture.cleanup();
  }
});

test("rejects multipart ranges before contacting the source", async () => {
  const fixture = await createFixture();
  try {
    const before = fixture.seen.length;
    const response = await fetch(`${fixture.baseUrl}/media/demo.mp4`, {
      headers: { Range: "bytes=0-1,4-5" },
    });
    assert.equal(response.status, 416);
    assert.equal(fixture.seen.length, before);
  } finally {
    await fixture.cleanup();
  }
});

test("maps upstream failures to a concise 502", async () => {
  const upstream = http.createServer((_req, res) => res.writeHead(500).end("internal detail"));
  const upstreamPort = await listen(upstream);
  const app = express();
  mountVideoRoutes(app, { videoUrl: `http://127.0.0.1:${upstreamPort}/fail` });
  const proxy = http.createServer(app);
  const proxyPort = await listen(proxy);

  try {
    const response = await fetch(`http://127.0.0.1:${proxyPort}/media/demo.mp4`);
    assert.equal(response.status, 502);
    assert.equal(await response.text(), "Video source unavailable");
  } finally {
    await close(proxy);
    await close(upstream);
  }
});
