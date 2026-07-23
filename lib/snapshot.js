// Shared utility: push the risk result into the npoint snapshot (FDC's data source).
const SNAPSHOT_URL = "https://api.npoint.io/3bbb3e2421ca5ea701d8";

/**
 * Update the off-chain snapshot. Includes one retry (npoint occasionally times out).
 * @param {{score:number, reason:string}} risk
 * @returns {Promise<object>} The written payload
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
      if (attempt === 2) throw new Error(`Failed to update snapshot (after retry): ${e.message}`);
      console.log("   Snapshot update timed out, retrying...");
    }
  }
}

module.exports = { updateSnapshot, SNAPSHOT_URL };
