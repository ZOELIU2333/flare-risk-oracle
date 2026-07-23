// Risk analysis strategy: FTSO real-time price analysis (used by the backend)
// The FTSO block-latency feed provides only price (no 24h change / volume), so the prompt is concise and explicitly avoids fixating on missing fields.
const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v)) || 0));

module.exports = {
  name: "ftso-live-analysis",
  description: "Multi-dimensional risk analysis based on Flare FTSO real-time prices",

  buildPrompt(input) {
    const trend = Array.isArray(input.trend) && input.trend.length >= 2
      ? `\n\nRisk score history from the last few runs (oldest to newest): [${input.trend.join(", ")}]. Determine whether risk is rising, falling, or stable, and reflect this trend in your assessment.`
      : "";
    const context = (input.btc || input.eth)
      ? `\n\nOverall crypto market context (also from Flare FTSO):\n- BTC/USD: $${input.btc}\n- ETH/USD: $${input.eth}\nConsider cross-asset risk contagion: the state of the broader crypto market (BTC/ETH) affects the systemic risk of XRP as collateral. If the broader market is under pressure, XRP risk should rise accordingly.`
      : "";
    return `You are a DeFi asset risk analysis engine. Based on the real-time price provided by the Flare FTSO oracle, assess the risk of using XRP (FXRP) as DeFi collateral.

Primary asset XRP/USD price (from the Flare FTSO on-chain oracle): $${input.price}${context}${trend}

Assess based on the price level, XRP's characteristics as a mainstream large-cap asset, and the overall state of the crypto market. Do not fixate on missing data.

Evaluate across three dimensions (each 0-100) and give an overall risk score:
- marketRisk: price and market-direction risk (including broader-market contagion)
- volatilityRisk: volatility risk
- liquidityRisk: liquidity risk

Output strictly the following JSON only, with no extra text and no markdown:
{"marketRisk": <0-100>, "volatilityRisk": <0-100>, "liquidityRisk": <0-100>, "score": <0-100 overall integer score>, "reason": "<short reason in English, no more than 90 characters; mention any clear trend or broader-market contagion if present>"}`;
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
