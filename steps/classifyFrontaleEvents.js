// step4
// - 將資料分類 A / B / C
// - 清洗標題
import { readJson, writeJson } from "../utils/storage.js";

/**
 * ================================
 * 分類關鍵字
 * ================================
 */
const TEAM_KEYWORDS = ["川崎F", "川崎Ｆ", "川崎フロンターレ", "フロンターレ"];
const MATCH_KEYWORDS = [
  "試合", "勝", "敗", "引き分け", "ゴール", "失点",
  "スタメン", "途中出場", "監督", "評価"
];

const OFFICIAL_KEYWORDS = [
  "お知らせ", "決定", "発表", "について", "販売",
  "チケット", "移籍", "負傷", "加入", "離脱"
];

const MEDIA_NOISE = [
  "Yahoo!ニュース",
  "ゲキサカ",
  "gekisaka.jp",
  "サッカーキング",
  "日刊スポーツ",
  "nikkansports.com",
  "公式",
  "川崎フロンターレ公式サイト",
  "川崎フロンターレ公式"
];

/**
 * ================================
 * 工具
 * ================================
 */
function includesAny(text = "", keywords = []) {
  return keywords.some(k => text.includes(k));
}

function makeId(prefix, index) {
  return `${prefix}${String(index).padStart(3, "0")}`;
}

function cleanTitle(raw = "") {
  let t = raw;

  t = t.replace(/【[^】]*】/g, "");
  t = t.replace(/（[^）]*）/g, "");
  t = t.replace(/\([^)]*\)/g, "");

  for (const noise of MEDIA_NOISE) {
    t = t.replaceAll(noise, "");
  }

  t = t.replace(/\s*[-｜|]\s*/g, " ");
  t = t.replace(/\s+/g, " ").trim();

  return t;
}

/**
 * ================================
 * Step 4 本體
 * ================================
 */
export async function classifyFrontaleEventsInternal() {
  const merged = (await readJson("weekly/merged.json")) || [];

  const A = [];
  const B = [];
  const C = [];

  let a = 0, b = 0, c = 0;

  for (const item of merged) {
    const title = item.title || "";
    const cleaned = item.source === "yahoo"
    ? cleanTitle(item.title)
    : item.title;

    // --- C 類（官方） ---
    if (item.source === "info") {
        c++;
        C.push({
            ...item,
            cleanTitle: cleaned,
            id: makeId("c", c),
            type: "C"
        });
        continue;
    }

    // --- B 類（日記）---
    if (item.source === "whats_new") {
      b++;
      B.push({
        ...item,
        cleanTitle: cleaned,
        id: makeId("b", b),
        type: "B"
      });
      continue;
    }

    // --- RSS 類：A / B ---
    if (includesAny(title, MATCH_KEYWORDS) && includesAny(title, TEAM_KEYWORDS)) {
      a++;
      A.push({
        ...item,
        cleanTitle: cleaned,
        id: makeId("a", a),
        type: "A"
      });
    } else {
      b++;
      B.push({
        ...item,
        cleanTitle: cleaned,
        id: makeId("b", b),
        type: "B"
      });
    }
  }

  const output = {
    meta: {
      generatedAt: new Date().toISOString()
    },
    summary: {
      A: A.length,
      B: B.length,
      C: C.length
    },
    events: { A, B, C }
  };

  await writeJson("weekly/classify.json", output);
  return output.summary;
}