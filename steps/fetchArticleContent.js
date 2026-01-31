// Step 7：fetchArticleContent（最終加工 + AI summary）
// - title_zh 禁止出現川崎相關字樣
// - title_zh_short：只對「選定的兩則事件」產生
// - tags：僅從 A / B 產生
import { readJson, writeJson } from "../utils/storage.js";

/* ---------- JSON 安全解析 ---------- */
function extractJSON(text = "") {
  return JSON.parse(
    text.replace(/```json/gi, "").replace(/```/g, "").trim()
  );
}

/* ---------- AI：事件摘要 + short ---------- */
async function aiSummarizeEvent(titles, descriptions, needShort) {
  const { VertexAI } = await import("@google-cloud/vertexai");
  const vertexAI = new VertexAI({ project: "msgtest-d13ce", location: "us-central1" });
  const model = vertexAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite-001",
    generationConfig: { temperature: 0, maxOutputTokens: 512 }
  });

  const prompt = `
你是一個新聞摘要系統。

請輸出 JSON：
{
  "title_zh": "...",
  ${needShort ? `"title_zh_short": "...",` : ""}
  "summary_zh": "..."
}

規則：
- 使用繁體中文
- 人名不翻譯
- 不新增、不評論
- title_zh ≤ 25 字
- 禁止出現：
  川崎前鋒、川崎Ｆ、川崎F、kawasaki frontale、フロンターレ
- 只輸出 JSON

標題：
${titles.join("\n")}

摘要：
${descriptions.join("\n")}
`.trim();

  const r = await model.generateContent(prompt);
  const text = r.response.candidates?.[0]?.content?.parts?.[0]?.text;
  return extractJSON(text);
}

/* ---------- AI：tags ---------- */
async function aiGenerateTags(textList) {
  const { VertexAI } = await import("@google-cloud/vertexai");
  const vertexAI = new VertexAI({ project: "msgtest-d13ce", location: "us-central1" });
  const model = vertexAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite-001",
    generationConfig: { temperature: 0, maxOutputTokens: 256 }
  });

  const prompt = `
請輸出 JSON：
{ "tags": [] }

規則：
- 只取人名 / 比賽名稱
- 不重複
- 不包含：川崎前鋒、川崎Ｆ、川崎F、kawasaki frontale、フロンターレ
- 僅輸出 JSON

內容：
${textList.join("\n")}
`.trim();

  const r = await model.generateContent(prompt);
  const text = r.response.candidates?.[0]?.content?.parts?.[0]?.text;
  return extractJSON(text).tags || [];
}

/* ---------- 主流程 ---------- */
export async function fetchArticleContentInternal() {
  const input = await readJson("weekly/selected.json");

  const output = {
    A: [],
    B: [],
    C: [],
    tags: [],
    title_zh_short: []
  };

  /* ====== ① 先決定哪兩則「需要 short」 ====== */
  let shortTargets = [];

  if ((input.events.A || []).length > 0) {
    shortTargets.push({ type: "A", index: 0 });
    if ((input.events.B || []).length > 0) {
      shortTargets.push({ type: "B", index: 0 });
    }
  } else {
    shortTargets = (input.events.B || [])
      .slice(0, 2)
      .map((_, i) => ({ type: "B", index: i }));
  }

  const needShortMap = new Set(
    shortTargets.map(t => `${t.type}-${t.index}`)
  );

  /* ====== ② 正式處理事件 ====== */
  const tagTexts = [];

  for (const type of ["A", "B", "C"]) {
    for (let i = 0; i < (input.events[type] || []).length; i++) {
      const event = input.events[type][i];
      const articles = event.articles || [];
      const titles = articles.map(a => a.title).filter(Boolean);
      const descriptions = articles.map(a => a.description).filter(Boolean);
      const hasWhatsNew = event.signal?.sources?.includes("whats_new");

      const needShort = needShortMap.has(`${type}-${i}`);

      const ai = await aiSummarizeEvent(
        titles,
        type === "C" ? [] : descriptions,
        needShort
      );

      const title_zh = ai.title_zh || "";
      const summary_zh =
        type === "A"
          ? ai.summary_zh || ""
          : type === "B"
          ? (hasWhatsNew ? "" : ai.summary_zh || "")
          : "";

      if ((type === "A" || type === "B") && title_zh) {
        tagTexts.push(title_zh);
        if (summary_zh) tagTexts.push(summary_zh);
      }

      if (needShort && ai.title_zh_short) {
        output.title_zh_short.push(ai.title_zh_short);
      }

      const image = articles.find(a => a.feature_img)?.feature_img || null;

      output[type].push({
        title_zh,
        summary_zh,
        image,
        ref: articles.map(a => ({ title: a.title, url: a.url }))
      });
    }
  }

  /* ====== ③ tags ====== */
  if (tagTexts.length > 0) {
    output.tags = await aiGenerateTags(tagTexts);
  }

  await writeJson("weekly/fetched.json", output);

  return {
    A: output.A.length,
    B: output.B.length,
    C: output.C.length,
    title_zh_short: output.title_zh_short.length,
    tags: output.tags.length
  };
}