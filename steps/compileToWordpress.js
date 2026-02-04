// step9：functions/steps/compileToWordpress.js
import fetch from "node-fetch";
import { readJson } from "../utils/storage.js";
import { ensureWpTags } from "./ensureWpTags.js";
import { uploadWpMedia } from "./uploadWpMedia.js";
import { processWeeklyData } from "../utils/kanjiConverter.js";

/**
 * Step 9：將 finished_YYYYMMDD.json 編譯並發佈到 WordPress
 *
 * @param {string} _fetchedDate - YYYYMMDD
 */
// 在 compileToWordpress 一開始
function toWpDate(ymd) {
  // ymd = "20260129"
  const y = ymd.slice(0, 4);
  const m = ymd.slice(4, 6);
  const d = ymd.slice(6, 8);

  // 固定台灣時間早上 08:00 發文（可自行調）
  return `${y}-${m}-${d}T23:30:00`;
}
function pickFeaturedImage(data) {
  for (const item of data.A || []) {
    if (item.downloadUrl) return item;
  }
  for (const item of data.B || []) {
    if (item.downloadUrl) return item;
  }
  return null;
}

export async function compileToWordpress(_fetchedDate) {
  // 1️⃣ 讀取 finished JSON
  const path = `weekly/finished_${_fetchedDate}.json`;
  const data = await readJson(path);

  if (!data) {
    throw new Error(`finished json not found: ${path}`);
  }

  // 1.5️⃣ 漢字轉換 (日文漢字 -> 繁體中文)
  processWeeklyData(data);

  const { A = [], B = [], C = [], tags = [], title_zh_short = [], date_range = [] } = data;


  // 2️⃣ 組 WordPress 文章標題
  const wpTitle = `川崎前鋒週報：${title_zh_short.join("、")} | ${date_range[0]}～${date_range[1]}`;

    const featuredItem = pickFeaturedImage(data);

    let featuredMediaId = null;

    if (featuredItem) {
    featuredMediaId = await uploadWpMedia(
        featuredItem.downloadUrl,
        featuredItem.title_zh,
        wpTitle
    );
    }

  // 3️⃣ 組文章摘要（excerpt）
  const topTitles = [
    A[0]?.title_zh,
    B[0]?.title_zh
  ].filter(Boolean);

  const wpExcerpt = `整理日本足球俱樂部川崎前鋒 ${date_range[0]}～${date_range[1]} 的新聞匯總，包含：${topTitles.join("、")} 等相關動態。`;

  // 4️⃣ 組 HTML 內容
  let content = "";
  content += `<p>歡迎收看本週川崎前鋒  ${date_range[0]}～${date_range[1]} 的新聞匯總</p>\n`;
  for (const block of [...A, ...B, ...C]) {
    content += `<h2 class="wp-block-heading">${block.title_zh}</h2>\n`;

    if (block.summary_zh) {
      content += `<p>${block.summary_zh}</p>\n`;
    }

    if (block.downloadUrl) {
      content += `
<div class="wp-block-image size-large">
  <figure class="aligncenter">
    <img decoding="async" src="${block.downloadUrl}" alt="${block.title_zh}">
  </figure>
</div><div style="height: 20px;"></div>\n`;
    }

    if (block.ref?.length) {
      content += `<ol class="wp-block-list">\n`;
      for (const r of block.ref) {
        content += `<li><a href="${r.url}" target="_blank">${r.title}</a></li>\n`;
      }
      content += `</ol>\n`;
    }
  }
  content += `<p><sub>新聞翻譯若有誤，請以原文為準</sub></p><p></p>\n`;

  // 5️⃣ WordPress tags：名稱 → id
  const tagIds = await ensureWpTags(tags);

  // 6️⃣ 發佈文章
  const wpAuth = "Basic " + Buffer.from(
    "411380pwpadmin:r52DnbH48wrcv1tLDXHuhzQJ"
  ).toString("base64");

  // [CHECK] 檢查是否已存在 (以日期區間判斷)
  try {
    // 改用 date_range[0] 搜尋，以確保能找到該週文章
    const checkRes = await fetch(`https://nangokufro.tw/wp-json/wp/v2/posts?search=${date_range[0]}&status=publish,draft,future`, {
      method: "GET",
      headers: { "Authorization": wpAuth }
    });
    
    if (checkRes.ok) {
      const found = await checkRes.json();
      // 檢查標題是否同時包含 起始日 與 結束日
      const exists = Array.isArray(found) && found.some(p => 
        p.title.rendered.includes(date_range[0]) && 
        p.title.rendered.includes(date_range[1])
      );
      
      if (exists) {
        console.log(`[CompileToWordpress] Article exists (Date Match: ${date_range[0]}~${date_range[1]}), skipping.`);
        return { ok: true, skipped: true };
      }
    }
  } catch (e) {
    console.warn("[CompileToWordpress] Failed to check duplicate, proceeding:", e);
  }

  // [POST] 發佈
  const res = await fetch("https://nangokufro.tw/wp-json/wp/v2/posts", {
    method: "POST",
    headers: {
      "Authorization": wpAuth,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: wpTitle,
      content,
      excerpt: wpExcerpt,
      status: "publish",
      tags: tagIds,
      categories: ['10'],
      date: toWpDate(data.fetched_date),
      comment_status : 'closed',
      featured_media: featuredMediaId
    })
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`WP publish failed: ${t}`);
  }

  return { ok: true };
}