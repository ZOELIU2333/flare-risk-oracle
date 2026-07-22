// M3 连通性测试：只验证能否调通 Moonshot(Kimi) API
require("dotenv").config();

const API_KEY = process.env.MOONSHOT_API_KEY;
const MODEL = process.env.MOONSHOT_MODEL || "moonshot-v1-8k";
const BASE_URL = "https://api.moonshot.cn/v1";

async function main() {
  if (!API_KEY) throw new Error("缺少 MOONSHOT_API_KEY");

  console.log("测试模型:", MODEL);
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "user", content: "只回复两个字：你好" },
      ],
      temperature: 0,
    }),
  });

  const text = await res.text();
  console.log("HTTP:", res.status);
  if (res.status !== 200) {
    console.log("响应体:", text);
    throw new Error("调用失败");
  }
  const data = JSON.parse(text);
  console.log("模型回复:", data.choices?.[0]?.message?.content);
  console.log("✅ Moonshot API 连通正常");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
