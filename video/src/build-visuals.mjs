import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const W = 1920;
const H = 1080;
const outDir = path.resolve("video/work/visuals");
const captures = path.resolve("video/work/captures");
await mkdir(outDir, { recursive: true });

const colors = {
  bg: "#050706",
  panel: "#0E1110",
  line: "#282E2B",
  ink: "#F2F2F3",
  muted: "#8A918E",
  green: "#3DE686",
  red: "#E5645D",
  amber: "#E5B567",
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svg(body, extra = "") {
  return Buffer.from(`
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .sans{font-family:Arial,Helvetica,sans-serif;letter-spacing:0}
        .mono{font-family:Menlo,Monaco,monospace;letter-spacing:0}
        .label{font-size:22px;font-weight:700;fill:${colors.green}}
        .title{font-size:62px;font-weight:700;fill:${colors.ink}}
        .body{font-size:28px;fill:${colors.muted}}
      </style>
      ${extra}
      ${body}
    </svg>
  `);
}

async function screenshotFrame(input, output, overlay) {
  await sharp(path.join(captures, input))
    .resize(W, H, { fit: "cover", position: "center" })
    .composite([{ input: svg(overlay) }])
    .png()
    .toFile(path.join(outDir, output));
}

await screenshotFrame(
  "12-shock-before.png",
  "01-hook.png",
  `<rect width="1920" height="1080" fill="#000" opacity=".18"/>
   <rect x="96" y="88" width="286" height="52" rx="4" fill="${colors.bg}" stroke="${colors.green}"/>
   <text x="118" y="122" class="mono label">PRICE UNCHANGED</text>`,
);

await screenshotFrame(
  "13-shock-result-same-price.png",
  "02-consensus.png",
  `<rect x="1390" y="82" width="430" height="126" rx="6" fill="${colors.bg}" stroke="${colors.red}"/>
   <text x="1420" y="126" class="mono" font-size="22" font-weight="700" fill="${colors.muted}">4 INDEPENDENT MODELS</text>
   <text x="1420" y="174" class="mono" font-size="34" font-weight="700" fill="${colors.red}">CONSENSUS 89</text>`,
);

const stages = [
  ["01", "FTSOv2", "Market state", colors.green],
  ["02", "FOUR AI MODELS", "Event + context", colors.ink],
  ["03", "DETERMINISTIC JSON", "Frozen snapshot", colors.amber],
  ["04", "FDC WEB2JSON", "Attested proof", colors.green],
  ["05", "IRiskOracle", "Protocol signal", colors.ink],
];

let stageMarkup = "";
for (let i = 0; i < stages.length; i += 1) {
  const [number, title, subtitle, color] = stages[i];
  const x = 90 + i * 365;
  stageMarkup += `
    <rect x="${x}" y="402" width="300" height="250" rx="8" fill="${colors.panel}" stroke="${colors.line}"/>
    <text x="${x + 28}" y="448" class="mono" font-size="18" fill="${colors.green}">${number}</text>
    <text x="${x + 28}" y="520" class="sans" font-size="${title.length > 17 ? 24 : 29}" font-weight="700" fill="${color}">${esc(title)}</text>
    <text x="${x + 28}" y="568" class="sans" font-size="23" fill="${colors.muted}">${esc(subtitle)}</text>`;
  if (i < stages.length - 1) {
    stageMarkup += `<path d="M${x + 312} 527 H${x + 350}" stroke="${colors.green}" stroke-width="3"/><path d="M${x + 350} 527 l-11 -7 v14 z" fill="${colors.green}"/>`;
  }
}

await sharp({ create: { width: W, height: H, channels: 4, background: colors.bg } })
  .composite([{ input: svg(`
    <text x="90" y="126" class="mono label">FLARE-NATIVE PIPELINE</text>
    <text x="90" y="218" class="sans title">From market state to protocol action</text>
    <text x="90" y="278" class="sans body">Non-deterministic analysis becomes reproducible before attestation.</text>
    ${stageMarkup}
    <rect x="820" y="720" width="650" height="74" rx="5" fill="${colors.panel}" stroke="${colors.amber}"/>
    <text x="1145" y="768" text-anchor="middle" class="mono" font-size="24" font-weight="700" fill="${colors.amber}">THE TECHNICAL HINGE: FREEZE, THEN VERIFY</text>
  `) }])
  .png()
  .toFile(path.join(outDir, "03-architecture.png"));

const onchain = await sharp(path.join(captures, "09-onchain.png"))
  .resize(1120, H, { fit: "cover", position: "left" })
  .png()
  .toBuffer();

await sharp({ create: { width: W, height: H, channels: 4, background: colors.bg } })
  .composite([
    { input: onchain, left: 0, top: 0 },
    { input: svg(`
      <rect x="1080" y="0" width="840" height="1080" fill="${colors.bg}"/>
      <rect x="1160" y="152" width="660" height="760" rx="8" fill="${colors.panel}" stroke="${colors.line}"/>
      <text x="1212" y="216" class="mono label">COSTON2 EXPLORER</text>
      <text x="1212" y="290" class="sans" font-size="46" font-weight="700" fill="${colors.green}">SUCCESS</text>
      <text x="1212" y="350" class="mono" font-size="20" fill="${colors.muted}">METHOD</text>
      <text x="1212" y="390" class="mono" font-size="28" fill="${colors.ink}">addRisk</text>
      <text x="1212" y="458" class="mono" font-size="20" fill="${colors.muted}">CONTRACT</text>
      <text x="1212" y="498" class="mono" font-size="28" fill="${colors.ink}">RiskOracleFdc</text>
      <text x="1212" y="566" class="mono" font-size="20" fill="${colors.muted}">BLOCK</text>
      <text x="1212" y="606" class="mono" font-size="28" fill="${colors.ink}">33099670</text>
      <text x="1212" y="674" class="mono" font-size="20" fill="${colors.muted}">TRANSACTION</text>
      <text x="1212" y="716" class="mono" font-size="20" fill="${colors.ink}">0xe1aa6bf6d89a1442</text>
      <text x="1212" y="750" class="mono" font-size="20" fill="${colors.ink}">2ce60af8646f8943...</text>
      <text x="1212" y="830" class="sans" font-size="22" fill="${colors.muted}">End-to-end FDC path proven on-chain.</text>
    `) },
  ])
  .png()
  .toFile(path.join(outDir, "04-proof.png"));

await screenshotFrame(
  "10-ecosystem.png",
  "05-protocols.png",
  `<rect x="1160" y="82" width="660" height="62" rx="5" fill="${colors.bg}" stroke="${colors.green}"/>
   <text x="1490" y="122" text-anchor="middle" class="mono" font-size="23" font-weight="700" fill="${colors.green}">ONE INTERFACE · TWO PROTOCOLS</text>`,
);

await sharp({ create: { width: W, height: H, channels: 4, background: colors.bg } })
  .composite([{ input: svg(`
    <text x="960" y="314" text-anchor="middle" class="sans" font-size="92" font-weight="700" fill="${colors.ink}">RISK<tspan fill="${colors.green}">ORACLE</tspan></text>
    <text x="960" y="408" text-anchor="middle" class="sans" font-size="38" fill="${colors.ink}">Verifiable risk intelligence for interoperable assets</text>
    <text x="960" y="474" text-anchor="middle" class="sans" font-size="31" fill="${colors.muted}">before price reacts.</text>
    <line x1="650" y1="554" x2="1270" y2="554" stroke="${colors.line}"/>
    <text x="960" y="632" text-anchor="middle" class="mono" font-size="22" font-weight="700" fill="${colors.green}">BUILT DURING FLARE SUMMER SIGNAL · COSTON2</text>
    <text x="960" y="738" text-anchor="middle" class="mono" font-size="24" fill="${colors.ink}">flare-risk-oracle.onrender.com</text>
    <text x="960" y="786" text-anchor="middle" class="mono" font-size="21" fill="${colors.muted}">github.com/ZOELIU2333/flare-risk-oracle</text>
  `) }])
  .png()
  .toFile(path.join(outDir, "06-close.png"));

const before = await sharp(path.join(captures, "12-shock-before.png"))
  .resize(960, H, { fit: "cover", position: "left" })
  .modulate({ brightness: 0.56 })
  .toBuffer();
const after = await sharp(path.join(captures, "13-shock-result-same-price.png"))
  .resize(960, H, { fit: "cover", position: "right" })
  .modulate({ brightness: 0.72 })
  .toBuffer();

await sharp({ create: { width: W, height: H, channels: 4, background: colors.bg } })
  .composite([
    { input: before, left: 0, top: 0 },
    { input: after, left: 960, top: 0 },
    { input: svg(`
      <rect width="1920" height="1080" fill="#000" opacity=".28"/>
      <line x1="960" y1="0" x2="960" y2="1080" stroke="${colors.green}" stroke-width="3"/>
      <text x="88" y="118" class="mono" font-size="24" font-weight="700" fill="${colors.muted}">PRICE-ONLY ORACLE</text>
      <text x="88" y="228" class="sans" font-size="116" font-weight="700" fill="${colors.muted}">LOW</text>
      <text x="1038" y="118" class="mono" font-size="24" font-weight="700" fill="${colors.green}">FOUR-MODEL CONSENSUS</text>
      <text x="1038" y="228" class="sans" font-size="116" font-weight="700" fill="${colors.red}">89</text>
      <rect x="580" y="902" width="760" height="92" rx="6" fill="${colors.bg}" stroke="${colors.line}"/>
      <text x="960" y="960" text-anchor="middle" class="sans" font-size="38" font-weight="700" fill="${colors.ink}">The price hasn't moved. The risk has.</text>
    `) },
  ])
  .png()
  .toFile(path.join(outDir, "thumbnail.png"));

function timestampToSeconds(value) {
  const [hours, minutes, rest] = value.split(":");
  const [seconds, millis] = rest.split(",");
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(millis) / 1000;
}

const srt = await readFile(path.resolve("video/captions.srt"), "utf8");
const blocks = srt.trim().split(/\n\s*\n/);
const captionManifest = [];
await mkdir(path.join(outDir, "captions"), { recursive: true });

for (const block of blocks) {
  const lines = block.split("\n");
  const index = lines[0].padStart(2, "0");
  const [start, end] = lines[1].split(" --> ");
  const textLines = lines.slice(2);
  const centerY = textLines.length === 1 ? 957 : 939;
  const tspans = textLines.map((line, lineIndex) =>
    `<tspan x="960" dy="${lineIndex === 0 ? 0 : 43}">${esc(line)}</tspan>`,
  ).join("");
  const captionSvg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="190" y="${textLines.length === 1 ? 902 : 880}" width="1540" height="${textLines.length === 1 ? 92 : 126}" rx="6" fill="#050706" fill-opacity=".88" stroke="#282E2B"/>
      <text x="960" y="${centerY}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="600" fill="#F2F2F3">${tspans}</text>
    </svg>
  `);
  const file = path.join(outDir, "captions", `caption-${index}.png`);
  await sharp(captionSvg).png().toFile(file);
  captionManifest.push([
    index,
    timestampToSeconds(start).toFixed(3),
    timestampToSeconds(end).toFixed(3),
    file,
  ].join("\t"));
}

await writeFile(path.join(outDir, "captions.tsv"), `${captionManifest.join("\n")}\n`);

console.log(`Rendered visuals to ${outDir}`);
