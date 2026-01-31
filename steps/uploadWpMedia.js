import fetch from "node-fetch";

const WP_BASE = "https://nangokufro.tw/wp-json/wp/v2";
const WP_AUTH =
  "Basic " +
  Buffer.from(
    "411380pwpadmin:r52DnbH48wrcv1tLDXHuhzQJ"
  ).toString("base64");

/**
 * 將圖片 URL 上傳為 WordPress Media
 * @param {string} imageUrl
 * @param {string} alt
 * @param { string } title
 * @returns {number|null} mediaId
 */
export async function uploadWpMedia(imageUrl, alt , title) {
  if (!imageUrl) return null;

  // 1️⃣ 先把圖片抓回來
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;

  const buffer = await imgRes.buffer();

  // 2️⃣ 上傳到 WordPress
  const res = await fetch(`${WP_BASE}/media`, {
    method: "POST",
    headers: {
      Authorization: WP_AUTH,
      "Content-Disposition": `attachment; filename="featured.jpg"`,
      "Content-Type": "image/jpeg"
    },
    body: buffer
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error("Upload media failed: " + t);
  }

  const media = await res.json();

  // 3️⃣ 設定 alt text
  await fetch(`${WP_BASE}/media/${media.id}`, {
    method: "POST",
    headers: {
      Authorization: WP_AUTH,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      alt_text: alt,
      caption : title
    })
  });

  return media.id;
}