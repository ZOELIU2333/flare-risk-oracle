// AI Provider: Anthropic (Claude) via 京东云中转。
// Claude 走 Anthropic 原生格式(/v1/messages)，与 OpenAI 的 /chat/completions 不同：
// - 请求体需 max_tokens；无 response_format，靠 prompt 约束 JSON
// - 鉴权用 x-api-key + anthropic-version 头
// - 响应文本在 content[0].text
require("dotenv").config();

function makeClaudeProvider({ name, model, apiKey, baseUrl }) {
  // baseUrl 形如 https://.../anthropic，端点为 {baseUrl}/v1/messages
  const url = baseUrl.replace(/\/+$/, "") + "/v1/messages";

  async function callOnce(prompt, timeoutMs) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt + "\n\nOutput ONLY valid JSON, no markdown fences." }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${name} ${res.status}: ${text.slice(0, 150)}`);
    let content = JSON.parse(text).content?.[0]?.text ?? "";
    // 兜底：去掉可能的 ```json 围栏
    content = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(content);
  }

  // 中转对 Claude 有每秒限流(429)，失败时退避重试：等 (1.5s, 3s, 4.5s) 再试，最多 3 次
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

module.exports = { makeClaudeProvider };
