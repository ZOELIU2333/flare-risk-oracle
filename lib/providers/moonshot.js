// AI Provider: Moonshot (Kimi)。kimi-k2.6 较慢(~70s)且偶尔超时，故加一次重试。
require("dotenv").config();

const API_KEY = process.env.MOONSHOT_API_KEY;
const MODEL = process.env.MOONSHOT_MODEL || "kimi-k2.6";
const URL = "https://api.moonshot.cn/v1/chat/completions";

async function callOnce(prompt, timeoutMs) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 1,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Moonshot ${res.status}: ${text.slice(0, 120)}`);
  const content = JSON.parse(text).choices?.[0]?.message?.content;
  return JSON.parse(content);
}

// 单次超时 100s，失败(超时/非JSON)重试一次
async function chatJson(prompt, timeoutMs = 100000) {
  if (!API_KEY) throw new Error("缺少 MOONSHOT_API_KEY");
  try {
    return await callOnce(prompt, timeoutMs);
  } catch (e) {
    console.warn(`[Kimi] retry after: ${e.message.slice(0, 50)}`);
    return await callOnce(prompt, timeoutMs);
  }
}

module.exports = { name: "Kimi", model: MODEL, chatJson };
