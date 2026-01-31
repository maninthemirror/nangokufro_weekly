// step5用ai做去重
import { readJson, writeJson } from "../utils/storage.js";

/* ---------- utils ---------- */
function extractJSON(text = "") {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

const TEAM_RULES = [
  { token: "__TEAM__", patterns: ["川崎フロンターレ", "フロンターレ", "川崎Ｆ", "川崎F", "川崎"] }
];

function normalizeTeam(text = "") {
  let t = text.toLowerCase();
  for (const r of TEAM_RULES) {
    for (const p of r.patterns) t = t.replaceAll(p.toLowerCase(), r.token);
  }
  return t;
}

function extractKeywords(title = "") {
  return normalizeTeam(title)
    .replace(/[【】\[\]（）()]/g, "")
    .split(/[\s・、]/)
    .filter(w => w.length >= 2);
}

function mayBeDuplicate(a, b) {
  const A = extractKeywords(a.cleanTitle || a.title || "");
  const B = extractKeywords(b.cleanTitle || b.title || "");
  const overlap = A.filter(w => B.includes(w));
  return overlap.length >= 2;
}

/* ---------- AI ---------- */
async function aiSemanticCluster(items) {
  if (items.length <= 1) {
    return [{ ids: items.map(i => i.id), reason: "single" }];
  }

  const { VertexAI } = await import("@google-cloud/vertexai");
  const vertexAI = new VertexAI({ project: "msgtest-d13ce", location: "us-central1" });
  const model = vertexAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite-001",
    generationConfig: { temperature: 0, maxOutputTokens: 512 }
  });

  const listText = items.map((i, idx) => `${idx + 1}. (${i.id}) ${i.cleanTitle}`).join("\n");
  const prompt = `你是一個新聞事件去重系統，不是聊天助理。

以下提供的是「已清洗過的新聞標題」，來源、平台、分類標籤都已移除。
請僅根據「事件語意是否相同」進行分群。

規則：

- 若多則標題描述的是同一件事情，請將它們分在同一群
- 若無法確定是同一事件，請不要合併
- 不要猜測、不延伸、不補充背景
- 不要解釋你的推理過程
- 不要輸出任何 JSON 以外的文字
- 不要使用 \`json 或\`  標記
- 請確保輸出為「合法 JSON」

輸出格式（必須完全一致）：
[
{
"ids": ["b001", "b004"]
}
]

如果所有標題都無法合併，請輸出：
[]

如果你無法完成判斷，請輸出：
[]

新聞標題清單：
${listText}`.trim();

  try {
    const r = await model.generateContent(prompt);
    const text = r.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("empty");
    const parsed = extractJSON(text);
    if (!Array.isArray(parsed)) throw new Error("invalid");
    return parsed.map(c => ({
        ids: c.ids
    }));
  } catch (e) {
    return items.map(i => ({ ids: [i.id] }));
  }
}

/* ---------- core ---------- */
async function processGroup(type, items) {
  if (!items || items.length === 0) return [];

  // 只有 1 篇：不進 AI，但要輸出
  if (items.length === 1) {
    const item = items[0];
    return [{
      eventId: `${type}-1`,
      type,
      topic: item.title,
      articles: [item],
      signal: {
        count: 1,
        sources: [item.source]
      },
      aiDecision: {
        used: false,
        clusters: [{
          ids: [item.id],
          reason: "單篇資料，未進 AI"
        }]
      }
    }];
  }

  // ≥ 2 篇：全進 AI
  let clusters = await aiSemanticCluster(
    items.map(i => ({ id: i.id, cleanTitle: i.cleanTitle }))
    );

    if (!clusters || clusters.length === 0) {
        clusters = items.map(i => ({
            ids: [i.id]
        }));
    }
    const usedIds = new Set(
    clusters.flatMap(c => c.ids)
    );

    const singleClusters = items
    .filter(i => !usedIds.has(i.id))
    .map(i => ({ ids: [i.id], _single: true }));

    clusters = [...clusters, ...singleClusters];
  const map = Object.fromEntries(items.map(i => [i.id, i]));

  return clusters.map((cluster, idx) => {
    const articles = cluster.ids.map(id => map[id]).filter(Boolean);
    const sources = [...new Set(articles.map(a => a.source))];

    return {
      eventId: `${type}-${idx + 1}`,
      type,
      topic: articles[0]?.title || "",
      articles,
      signal: {
        count: articles.length,
        sources
      },
      aiDecision: {
        used: !cluster._single,
        clusters: [{ ids: cluster.ids }]
        }
    };
  });
}

export async function semanticMergeFrontaleEventsInternal() {
  const input = await readJson("weekly/classify.json");
  const result = {
    meta: { mergedAt: new Date().toISOString(), aiUsed: {} },
    events: { A: [], B: [], C: [] }
  };

  for (const t of ["A", "B", "C"]) {
    const items = input.events?.[t] || [];
    const merged = await processGroup(t, items);
    result.events[t] = merged;
    result.meta.aiUsed[t] = merged.some(m => m.aiDecision?.used);
  }

  await writeJson("weekly/semantic.json", result);
  return {
    A: result.events.A.length,
    B: result.events.B.length,
    C: result.events.C.length
  };
}