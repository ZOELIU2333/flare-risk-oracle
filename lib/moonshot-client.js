// 统一封装 Moonshot(Kimi) 调用：处理认证、超时、错误、JSON 解析与校验。
// 让上层分析器不用重复写 fetch 逻辑。
require("dotenv").config();

const API_KEY = process.env.MOONSHOT_API_KEY;
const MODEL = process.env.MOONSHOT_MODEL || "kimi-k2.6";
const MOONSHOT_URL = "https://api.moonshot.cn/v1/chat/completions";

/**
 * 调用 Kimi，强制 JSON 输出，返回解析后的对象。
 * @param {string} prompt 用户 prompt
 * @param {number} timeoutMs 超时(默认90s，这代 kimi 较慢)
 * @returns {Promise<object>} 解析后的 JSON 对象
 */
async function chatJson(prompt, timeoutMs = 90000) {
  if (!API_KEY) throw new Error("缺少 MOONSHOT_API_KEY，请在 .env 配置");

  const res = await fetch(MOONSHOT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 1, // 当前 kimi 系列强制为 1
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Moonshot 调用失败 ${res.status}: ${text}`);

  const content = JSON.parse(text).choices?.[0]?.message?.content;
  if (!content) throw new Error("Moonshot 返回内容为空: " + text.slice(0, 200));

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Moonshot 返回的不是合法 JSON: " + content.slice(0, 200));
  }
}

module.exports = { chatJson, MODEL };
