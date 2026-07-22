// 风险分析器：支持单 AI 和多 AI 共识两种模式
const { consensus } = require("./consensus");

const moonshot = require("./providers/moonshot");
const deepseek = require("./providers/deepseek");

// 可用的 AI providers（有 key 才启用）
function activeProviders() {
  const list = [];
  if (process.env.MOONSHOT_API_KEY) list.push(moonshot);
  if (process.env.DEEPSEEK_API_KEY) list.push(deepseek);
  return list;
}

// 用单个 provider 跑一个策略
async function runOne(provider, strategy, input) {
  const prompt = strategy.buildPrompt(input);
  const parsed = await provider.chatJson(prompt);
  const norm = strategy.normalize(parsed);
  return { provider: provider.name, model: provider.model, ...norm };
}

// 兼容旧接口：单 AI（默认第一个可用 provider）
async function analyze(strategy, input) {
  const providers = activeProviders();
  if (!providers.length) throw new Error("无可用 AI provider");
  return runOne(providers[0], strategy, input);
}

// 多 AI 共识：并行调所有可用 provider → 综合
// fallback: { [providerName]: 上次成功的结果 }，某AI这次失败时用它兜底(标 stale)
async function analyzeMultiAI(strategy, input, fallback = {}) {
  const providers = activeProviders();
  if (!providers.length) throw new Error("无可用 AI provider");

  const settled = await Promise.allSettled(
    providers.map((p) => runOne(p, strategy, input))
  );
  const results = settled.map((s, i) => {
    if (s.status === "fulfilled") return s.value;
    // 这次失败 → 用上次成功的该 AI 结果兜底
    const name = providers[i].name;
    if (fallback[name]) return { ...fallback[name], stale: true };
    return null;
  });
  return consensus(results);
}

module.exports = { analyze, analyzeMultiAI, activeProviders };
