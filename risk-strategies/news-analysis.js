// 风险分析策略：突发新闻分析（杀手锏）
// 输入一条新闻文本，让 AI 读懂非结构化信息并研判风险 —— 规则/传统预言机做不到。

const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v)) || 0));

module.exports = {
  name: "news-analysis",
  description: "读懂突发新闻文本，在价格反应前抢先研判风险",

  // 构建 prompt。input: { news, price }
  buildPrompt(input) {
    return `你是一个专业的 DeFi 资产风控分析引擎。当前 XRP 价格为 $${input.price}（价格暂未大幅波动）。
现在收到一条关于 XRP 的突发新闻，请你阅读并判断：这条新闻对将 XRP(FXRP) 作为 DeFi 抵押品的风险有何影响？

突发新闻：
"""
${input.news}
"""

请注意：价格可能还没来得及反应，但新闻本身可能预示重大风险。请基于对新闻内容的理解，给出 0-100 的风险评分和简短英文理由。
严格只输出如下 JSON，不要多余文字、不要 markdown：
{"score": <0-100整数>, "reason": "<简短英文理由,不超过90字符>"}`;
  },

  normalize(parsed) {
    return {
      score: clamp(parsed.score),
      reason: String(parsed.reason || "").slice(0, 120),
      dimensions: {}, // 新闻策略不产出分维度评分
    };
  },
};
