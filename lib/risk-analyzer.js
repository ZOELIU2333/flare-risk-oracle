// Risk analyzer: supports both single-AI and multi-AI consensus modes
const { consensus } = require("./consensus");

const { makeProvider } = require("./providers/openai");
const { makeClaudeProvider } = require("./providers/anthropic");
const deepseek = require("./providers/deepseek");

// JD Cloud relay: GPT-5.5 uses the OpenAI format (/v1), Claude uses the Anthropic format (/anthropic), sharing one key
const JD = process.env.JDCLOUD_API_KEY;
const JD_OPENAI_URL = process.env.JDCLOUD_BASE_URL || "https://modelservice.jdcloud.com/v1";
const JD_ANTHROPIC_URL = process.env.JDCLOUD_ANTHROPIC_URL || "https://modelservice.jdcloud.com/anthropic";
const gpt = JD
  ? makeProvider({ name: "GPT-5.5", model: process.env.GPT_MODEL || "GPT-5.5", apiKey: JD, baseUrl: JD_OPENAI_URL })
  : null;
const opus = JD
  ? makeClaudeProvider({ name: "Claude Opus 4.8", model: process.env.OPUS_MODEL || "Claude-Opus-4.8", apiKey: JD, baseUrl: JD_ANTHROPIC_URL })
  : null;
const qwen = JD
  ? makeProvider({ name: "Qwen3-235B", model: process.env.QWEN_MODEL || "Qwen3-235B-A22B", apiKey: JD, baseUrl: JD_OPENAI_URL })
  : null;

// Available AI providers (enabled only when a key is present)
function activeProviders() {
  const list = [];
  if (gpt) list.push(gpt);
  if (opus) list.push(opus);
  if (process.env.DEEPSEEK_API_KEY) list.push(deepseek);
  if (qwen) list.push(qwen);
  return list;
}

// Run one strategy with a single provider
async function runOne(provider, strategy, input) {
  const prompt = strategy.buildPrompt(input);
  const parsed = await provider.chatJson(prompt);
  const norm = strategy.normalize(parsed);
  return { provider: provider.name, model: provider.model, ...norm };
}

// Backward-compatible interface: single AI (defaults to the first available provider)
async function analyze(strategy, input) {
  const providers = activeProviders();
  if (!providers.length) throw new Error("No available AI provider");
  return runOne(providers[0], strategy, input);
}

// Multi-AI consensus: call all available providers in parallel → aggregate
// fallback: { [providerName]: last successful result }, used to fall back for an AI that fails this time (flagged stale)
async function analyzeMultiAI(strategy, input, fallback = {}) {
  const providers = activeProviders();
  if (!providers.length) throw new Error("No available AI provider");

  const settled = await Promise.allSettled(
    providers.map((p) => runOne(p, strategy, input))
  );
  const results = settled.map((s, i) => {
    if (s.status === "fulfilled") return s.value;
    // Failed this time → fall back to this AI's last successful result
    const name = providers[i].name;
    if (fallback[name]) return { ...fallback[name], stale: true };
    return null;
  });
  return consensus(results);
}

module.exports = { analyze, analyzeMultiAI, activeProviders };
