// AI Provider: DeepSeek (OpenAI-compatible API, fast)
require("dotenv").config();

const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const URL = "https://api.deepseek.com/v1/chat/completions";

async function chatJson(prompt, timeoutMs = 60000) {
  if (!API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 150)}`);
  const content = JSON.parse(text).choices?.[0]?.message?.content;
  return JSON.parse(content);
}

module.exports = { name: "DeepSeek", model: MODEL, chatJson };
