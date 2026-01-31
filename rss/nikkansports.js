import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const URL = "https://www.nikkansports.com/rss/soccer/jleague/atom/frontale.xml";

function extractLink(entry) {
  if (!entry.link) return null;

  // link 是 array（Atom 常見）
  if (Array.isArray(entry.link)) {
    const first = entry.link.find(l => l?.$?.href);
    return first?.$?.href || null;
  }

  // link 是 object
  if (entry.link.$?.href) {
    return entry.link.$.href;
  }

  // link 直接是字串
  if (typeof entry.link === "string") {
    return entry.link;
  }

  return null;
}

export async function fetchNikkansports() {
  const res = await fetch(URL);
  if (!res.ok) {
    throw new Error(`Nikkansports RSS fetch failed: ${res.status}`);
  }

  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false });

  const entries = parsed?.feed?.entry;
  if (!entries) return [];

  const list = Array.isArray(entries) ? entries : [entries];

  return list
    .map(e => {
      const url = extractLink(e);
      if (!url) return null;

      return {
        title: typeof e.title === "string" ? e.title : e.title?._ ?? null,
        url,
        published: e.updated || e.published || null,
        source: "nikkansports",
        type: "A"
      };
    })
    .filter(Boolean); // 🔥 關鍵：濾掉壞資料
}