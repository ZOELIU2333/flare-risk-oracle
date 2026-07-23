// Risk analysis strategy: breaking-news analysis (the killer feature)
// Takes a piece of news text and has the AI comprehend unstructured information to judge risk — something rule-based/traditional oracles cannot do.

const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v)) || 0));

module.exports = {
  name: "news-analysis",
  description: "Comprehend breaking-news text and judge risk ahead of the price reaction",

  // Build the prompt. input: { news, price }
  buildPrompt(input) {
    return `You are a professional DeFi asset risk analysis engine. The current XRP price is $${input.price} (the price has not moved significantly yet).
You have just received a piece of breaking news about XRP. Read it and judge: how does this news affect the risk of using XRP (FXRP) as DeFi collateral?

Breaking news:
"""
${input.news}
"""

Note: the price may not have had time to react yet, but the news itself may signal significant risk. Based on your understanding of the news content, give a risk score from 0-100 and a short reason in English.
Output strictly the following JSON only, with no extra text and no markdown:
{"score": <0-100 integer>, "reason": "<short reason in English, no more than 90 characters>"}`;
  },

  normalize(parsed) {
    return {
      score: clamp(parsed.score),
      reason: String(parsed.reason || "").slice(0, 120),
      dimensions: {}, // the news strategy does not produce per-dimension scores
    };
  },
};
