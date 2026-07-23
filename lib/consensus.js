// Multi-AI consensus layer: aggregates risk assessments from multiple providers
// Strategy: weighted-average combined score + divergence flagging (high divergence is itself a risk signal)

const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v)) || 0));

/**
 * Aggregate the risk results from multiple AI providers.
 * @param {Array<{provider:string, model:string, score:number, reason:string, dimensions:object}>} results
 * @returns Combined structure { score, reason, divergence, agreement, sources, dimensions }
 */
function consensus(results) {
  const valid = results.filter((r) => r && Number.isFinite(r.score));
  if (valid.length === 0) throw new Error("All AI providers failed; no usable result");

  const scores = valid.map((r) => r.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const divergence = max - min; // Divergence: the largest spread across the AI scores

  // When divergence is high, bias the combined score conservatively (toward higher risk), since uncertainty is itself a risk
  const score = divergence > 25 ? Math.round((avg + max) / 2) : avg;

  // Combined dimensions (average of each dimension)
  const dims = ["marketRisk", "volatilityRisk", "liquidityRisk"];
  const dimensions = {};
  for (const d of dims) {
    const vals = valid.map((r) => r.dimensions?.[d]).filter(Number.isFinite);
    if (vals.length) dimensions[d] = clamp(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // Combined rationale: primarily use the reason from the AI with the highest (most cautious) score
  const lead = valid.reduce((a, b) => (b.score > a.score ? b : a), valid[0]);
  let reason = lead.reason;
  if (divergence > 25) reason = `AI models diverge (${min}-${max}). ` + reason;

  return {
    score,
    reason,
    divergence,
    agreement: divergence <= 15 ? "high" : divergence <= 30 ? "moderate" : "low",
    dimensions,
    sources: valid.map((r) => ({ provider: r.provider, model: r.model, score: r.score, reason: r.reason })),
  };
}

module.exports = { consensus };
