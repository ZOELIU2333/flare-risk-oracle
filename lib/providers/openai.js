// Generic OpenAI-compatible provider factory.
// The JD Cloud relay (modelservice.jdcloud.com), DeepSeek, and others all follow the OpenAI /chat/completions spec;
// the only differences are name/model/apiKey/baseUrl, so a factory generates them to avoid duplicated code.
require("dotenv").config();

// If baseUrl ends with /v1, automatically append /chat/completions; if it is already a full endpoint, use it as-is
function resolveUrl(baseUrl) {
  if (baseUrl.includes("/chat/completions")) return baseUrl;
  return baseUrl.replace(/\/+$/, "") + "/chat/completions";
}

// Build a provider: { name, model, chatJson }
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

  // Single-call timeout is 90s; retry once on failure (timeout / non-JSON)
  // The relay may rate-limit (429); on failure, retry with backoff: wait (1.5s, 3s, 4.5s) before retrying, up to 4 times
  async function chatJson(prompt, timeoutMs = 90000) {
    if (!apiKey) throw new Error(`Missing ${name} apiKey`);
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
