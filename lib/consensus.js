// 多 AI 共识层：综合多个 provider 的风险评估
// 策略：加权平均综合分 + 分歧标注（分歧大本身是风险信号）

const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v)) || 0));

/**
 * 综合多个 AI 的风险结果。
 * @param {Array<{provider:string, model:string, score:number, reason:string, dimensions:object}>} results
 * @returns 综合后的结构 { score, reason, divergence, agreement, sources, dimensions }
 */
function consensus(results) {
  const valid = results.filter((r) => r && Number.isFinite(r.score));
  if (valid.length === 0) throw new Error("所有 AI 均失败，无可用结果");

  const scores = valid.map((r) => r.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const divergence = max - min; // 分歧度：多个 AI 评分的最大差

  // 分歧大时综合分偏保守（向高风险靠），因为不确定性本身就是风险
  const score = divergence > 25 ? Math.round((avg + max) / 2) : avg;

  // 综合维度（各维度取平均）
  const dims = ["marketRisk", "volatilityRisk", "liquidityRisk"];
  const dimensions = {};
  for (const d of dims) {
    const vals = valid.map((r) => r.dimensions?.[d]).filter(Number.isFinite);
    if (vals.length) dimensions[d] = clamp(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // 综合理由：取评分最高(最谨慎)那个 AI 的理由为主
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
