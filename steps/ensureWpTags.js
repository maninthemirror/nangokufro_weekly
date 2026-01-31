// functions/steps/ensureWpTags.js
import fetch from "node-fetch";

const WP_BASE = "https://nangokufro.tw/wp-json/wp/v2";
const WP_AUTH =
  "Basic " +
  Buffer.from(
    "411380pwpadmin:r52DnbH48wrcv1tLDXHuhzQJ"
  ).toString("base64");

/**
 * 確保 tags 在 WordPress 中存在
 *
 * @param {string[]} tags - 標籤名稱（人名 / 比賽名）
 * @returns {number[]} tagIds
 */
export async function ensureWpTags(tags = []) {
  if (!tags.length) return [];

  // 1️⃣ 取得現有 tags（一次拉完，避免一直查）
  const existing = await fetchAllWpTags();

  // name → id 對照表
  const tagMap = new Map(
    existing.map(t => [t.name, t.id])
  );

  const tagIds = [];

  // 2️⃣ 逐一確認 / 建立
  for (const name of tags) {
    if (tagMap.has(name)) {
      // 已存在
      tagIds.push(tagMap.get(name));
      continue;
    }

    // 不存在 → 建立
    const created = await createWpTag(name);
    if (created?.id) {
      tagIds.push(created.id);
      tagMap.set(name, created.id); // 避免重複建
    }
  }

  return tagIds;
}

/**
 * 拉取 WordPress 所有 tags（處理分頁）
 */
async function fetchAllWpTags() {
  let page = 1;
  let all = [];

  while (true) {
    const res = await fetch(
      `${WP_BASE}/tags?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: WP_AUTH
        }
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch wp tags");
    }

    const list = await res.json();
    all = all.concat(list);

    // WordPress：不到 per_page 代表沒下一頁
    if (list.length < 100) break;
    page++;
  }

  return all;
}

/**
 * 建立單一 tag
 */
async function createWpTag(name) {
  const res = await fetch(`${WP_BASE}/tags`, {
    method: "POST",
    headers: {
      Authorization: WP_AUTH,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name
    })
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Create tag failed (${name}): ${t}`);
  }

  return res.json();
}