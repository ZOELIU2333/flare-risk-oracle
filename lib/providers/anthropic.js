// AI Provider: Anthropic (Claude) via the JD Cloud relay.
// Claude uses Anthropic's native format (/v1/messages), which differs from OpenAI's /chat/completions:
// - The request body requires max_tokens; there is no response_format, so JSON is enforced via the prompt
// - Authentication uses the x-api-key + anthropic-version headers
// - The response text lives at content[0].text
require("dotenv").config();

function makeClaudeProvider({ name, model, apiKey, baseUrl }) {
  // baseUrl looks like https://.../anthropic; the endpoint is {baseUrl}/v1/messages
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
    // Fallback: strip any ```json fences
    content = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(content);
  }

  // The relay rate-limits Claude per second (429); on failure, retry with backoff: wait (1.5s, 3s, 4.5s) before retrying, up to 3 times
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

module.exports = { makeClaudeProvider };
