// 风险分析策略：市场多维分析
// 输入 XRP 实时市场数据，让 AI 从市场/波动/流动性三维评估，产出综合风险分。

const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v)) || 0));

module.exports = {
  name: "market-analysis",
  description: "基于价格/波动/成交量的多维市场风控分析",

  // 构建 prompt。input: { price, change24h, volume24h }
  buildPrompt(input) {
    return `你是一个专业的 DeFi 资产风控分析引擎。基于以下 XRP 实时市场数据，从多个维度评估将 XRP(FXRP) 作为 DeFi 抵押品的风险。

市场数据：
- 当前价格: $${input.price}
- 24小时涨跌幅: ${input.change24h.toFixed(2)}%
- 24小时成交量: $${Math.round(input.volume24h).toLocaleString()}

请分别评估以下三个维度（各 0-100），再给出加权综合风险评分：
1. marketRisk（市场风险）：价格趋势、方向性风险
2. volatilityRisk（波动风险）：价格波动剧烈程度
3. liquidityRisk（流动性风险）：成交量是否充足、清算时能否顺利成交

严格只输出如下 JSON，不要多余文字、不要 markdown：
{"marketRisk": <0-100>, "volatilityRisk": <0-100>, "liquidityRisk": <0-100>, "score": <0-100综合分整数>, "reason": "<简短英文综合理由,不超过90字符>"}`;
  },

  // 规范化 AI 输出为统一风险结构
  normalize(parsed) {
    return {
      score: clamp(parsed.score),
      reason: String(parsed.reason || "").slice(0, 120),
      dimensions: {
        marketRisk: clamp(parsed.marketRisk),
        volatilityRisk: clamp(parsed.volatilityRisk),
        liquidityRisk: clamp(parsed.liquidityRisk),
      },
    };
  },
};
