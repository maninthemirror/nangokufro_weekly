import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";
import { toJST } from "../utils/time.js";
import { readJson, writeJson } from "../utils/storage.js";
import { RSS_SOURCES } from "../utils/rssSources.js";

const OUTPUT = "weekly/fetch_rss.json";

const KEYWORDS = ["川崎F", "川崎Ｆ", "川崎フロンターレ", "フロンターレ"];

function isFrontale(title = "") {
  return KEYWORDS.some(k => title.includes(k));
}

export async function fetchFrontaleRssInternal() {
  const existing = (await readJson(OUTPUT)) || [];
  const publishedSet = new Set(existing.map(e => e.published));
  let results = [...existing];

  for (const src of RSS_SOURCES) {
    const res = await fetch(src.url);
    const xml = await res.text();
    const json = await parseStringPromise(xml, { explicitArray: true });

    let items = [];

    // ✅ Atom（nikkansports）
    if (src.type === "atom" && json.feed?.entry) {
      items = json.feed.entry.map(e => ({
        title: e.title?.[0],
        description: e.summary?.[0] || null,
        url: e.id?.[0],
        published: e.published?.[0],
        feature_img: e.link?.find(l => l.$?.rel === "enclosure")?.$?.href || null,
      }));
    }

    // ✅ RSS（gekisaka / yahoo）
    if (src.source === "yahoo" && json.rss?.channel?.[0]?.item) {
      items = json.rss.channel[0].item.map(e => ({
        title: e.title?.[0],
        description: e.description?.[0] || null,
        url: e.link?.[0],
        published: e.pubDate?.[0],
        feature_img: e.enclosure?.[0]?.$?.url || e.image?.[0] || null,
      }));
    }
    
    if (src.source === "gekisaka" && json.rss?.channel?.[0]?.item) {
      items = json.rss.channel[0].item.map(e => ({
        title: e.title?.[0],
        description: e.description?.[0] || null,
        url: e.link?.[0],          // ✅ 用 link
        published: e.pubDate?.[0],
        feature_img: null          // ✅ 永遠 null
      }));
    }

    for (const item of items) {
      // 標題或敘述，兩者其一有關鍵字，就收錄
      const hit =
        isFrontale(item.title) ||
        isFrontale(item.description || "");

      if (!item.title || !hit) continue;

      if (!item.published) continue;

      const published = toJST(new Date(item.published)).toISOString();
      if (publishedSet.has(published)) continue;

      results.push({
        title: item.title || null,
        description: item.description,
        url: item.url,
        published,
        feature_img: item.feature_img,
        source: src.source,
      });

      publishedSet.add(published);
    }
  }

  await writeJson(OUTPUT, results);
  return { count: results.length };
}