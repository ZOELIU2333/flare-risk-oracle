// Risk analysis strategy: multi-dimensional market analysis
// Takes XRP real-time market data and has the AI assess it across market/volatility/liquidity dimensions to produce an overall risk score.

const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v)) || 0));

module.exports = {
  name: "market-analysis",
  description: "Multi-dimensional market risk analysis based on price/volatility/volume",

  // Build the prompt. input: { price, change24h, volume24h }
  buildPrompt(input) {
    return `You are a professional DeFi asset risk analysis engine. Based on the following XRP real-time market data, assess the risk of using XRP (FXRP) as DeFi collateral across multiple dimensions.

Market data:
- Current price: $${input.price}
- 24h change: ${input.change24h.toFixed(2)}%
- 24h volume: $${Math.round(input.volume24h).toLocaleString()}

Assess each of the following three dimensions (each 0-100), then give a weighted overall risk score:
1. marketRisk: price trend and directional risk
2. volatilityRisk: severity of price volatility
3. liquidityRisk: whether volume is sufficient and whether positions can be liquidated smoothly

Output strictly the following JSON only, with no extra text and no markdown:
{"marketRisk": <0-100>, "volatilityRisk": <0-100>, "liquidityRisk": <0-100>, "score": <0-100 overall integer score>, "reason": "<short overall reason in English, no more than 90 characters>"}`;
  },

  // Normalize the AI output into a unified risk structure
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
