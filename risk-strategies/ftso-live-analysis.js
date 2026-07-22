// 风险分析策略：FTSO 实时价格分析（后端用）
// FTSO block-latency feed 只提供价格（无24h涨跌/成交量），故 prompt 精简、明确不纠结缺失字段。
const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v)) || 0));

module.exports = {
  name: "ftso-live-analysis",
  description: "基于 Flare FTSO 实时价格的多维风控分析",

  buildPrompt(input) {
    const trend = Array.isArray(input.trend) && input.trend.length >= 2
      ? `\n\n最近几次的风险评分历史（从旧到新）: [${input.trend.join(", ")}]。请判断风险是在上升、下降还是平稳，并在评估中体现这一趋势。`
      : "";
    const context = (input.btc || input.eth)
      ? `\n\n加密市场整体背景（同样来自 Flare FTSO）:\n- BTC/USD: $${input.btc}\n- ETH/USD: $${input.eth}\n请考虑跨资产风险传染：加密市场整体（BTC/ETH）的状态会影响 XRP 作为抵押品的系统性风险。若大盘承压，XRP 风险应相应上升。`
      : "";
    return `你是一个 DeFi 资产风控分析引擎。基于 Flare FTSO 预言机提供的实时价格，评估将 XRP(FXRP) 作为 DeFi 抵押品的风险。

主资产 XRP/USD 价格（来自 Flare FTSO 链上预言机）: $${input.price}${context}${trend}

请结合价格水平、XRP 作为主流大市值资产的特性、以及加密市场整体状态给出评估。不要纠结于缺失的数据。

从三个维度评估（各 0-100），并给综合风险分：
- marketRisk：价格与市场方向风险（含大盘传染）
- volatilityRisk：波动风险
- liquidityRisk：流动性风险

严格只输出如下 JSON，不要多余文字、不要 markdown：
{"marketRisk": <0-100>, "volatilityRisk": <0-100>, "liquidityRisk": <0-100>, "score": <0-100综合分整数>, "reason": "<简短英文理由,不超过90字符,若有明显趋势或大盘传染请提及>"}`;
  },

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
