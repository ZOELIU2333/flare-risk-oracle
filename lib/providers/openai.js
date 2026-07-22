// 通用 OpenAI 兼容 provider 工厂。
// 京东云中转站(modelservice.jdcloud.com)与 DeepSeek 等均走 OpenAI /chat/completions 规范，
// 差异仅 name/model/apiKey/baseUrl，用工厂生成，避免重复代码。
require("dotenv").config();

// baseUrl 以 /v1 结尾则自动拼 /chat/completions；已是完整端点则原样用
function resolveUrl(baseUrl) {
  if (baseUrl.includes("/chat/completions")) return baseUrl;
  return baseUrl.replace(/\/+$/, "") + "/chat/completions";
}

// 生成一个 provider：{ name, model, chatJson }
function makeProvider({ name, model, apiKey, baseUrl }) {
  const url = resolveUrl(baseUrl);

  async function callOnce(prompt, timeoutMs) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${name} ${res.status}: ${text.slice(0, 150)}`);
    const content = JSON.parse(text).choices?.[0]?.message?.content;
    return JSON.parse(content);
  }

  // 单次超时 90s，失败(超时/非JSON)重试一次
  // 中转可能限流(429)，失败时退避重试：等 (1.5s, 3s, 4.5s) 再试，最多 4 次
  async function chatJson(prompt, timeoutMs = 90000) {
    if (!apiKey) throw new Error(`缺少 ${name} apiKey`);
    const maxAttempts = 4;
    let lastErr;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        return await callOnce(prompt, timeoutMs);
      } catch (e) {
        lastErr = e;
        if (i < maxAttempts - 1) {
          const wait = 1500 * (i + 1);
          console.warn(`[${name}] retry #${i + 1} in ${wait}ms after: ${e.message.slice(0, 60)}`);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
    }
    throw lastErr;
  }

  return { name, model, chatJson };
}

module.exports = { makeProvider };
