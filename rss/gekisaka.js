import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const URL = "https://web.gekisaka.jp/feed?category=domestic";

function normalizeItem(item) {
  if (!item) return null;

  const title =
    typeof item.title === "string"
      ? item.title
      : item.title?._ ?? null;

  const url =
    typeof item.link === "string"
      ? item.link
      : item.link?._ ?? null;

  const published = item.pubDate || item.date || null;

  if (!title || !url) return null;

  return {
    title,
    url,
    published,
    source: "gekisaka",
    type: "A"
  };
}

export async function fetchGekisaka() {
  const res = await fetch(URL);
  if (!res.ok) {
    throw new Error(`Gekisaka RSS fetch failed: ${res.status}`);
  }

  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false });

  const items = parsed?.rss?.channel?.item;
  if (!items) return [];

  const list = Array.isArray(items) ? items : [items];

  return list
    .map(normalizeItem)
    .filter(Boolean);
}