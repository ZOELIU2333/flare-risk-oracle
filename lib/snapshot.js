// 共用工具：把风险结果更新到 npoint 快照（FDC 的数据源）。
const SNAPSHOT_URL = "https://api.npoint.io/3bbb3e2421ca5ea701d8";

/**
 * 更新链下快照。带一次重试（npoint 偶发超时）。
 * @param {{score:number, reason:string}} risk
 * @returns {Promise<object>} 写入的 payload
 */
async function updateSnapshot(risk) {
  const payload = {
    score: risk.score,
    reason: risk.reason,
    timestamp: Math.floor(Date.now() / 1000),
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(SNAPSHOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return payload;
    } catch (e) {
      if (attempt === 2) throw new Error(`更新快照失败(重试后): ${e.message}`);
      console.log("   快照更新超时，重试...");
    }
  }
}

module.exports = { updateSnapshot, SNAPSHOT_URL };
