// ✅ Step 8：圖片上傳 Storage
import fetch from "node-fetch";
import sharp from "sharp";
import admin from "firebase-admin";
import { readJson, writeJson } from "../utils/storage.js";
import { compileToWordpress } from "./compileToWordpress.js";

// ⚠️ 不要 initializeApp
const bucket = admin.storage().bucket();

function ymd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
const _fetchedDate = ymd();

async function uploadImage(url, eventId) {
  if (!url) return null;

  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());

  const resized = await sharp(buf)
    .resize({ width: 960, withoutEnlargement: true })
    .jpeg()
    .toBuffer();

  // ✅ 指定 weekly/YYYYMMDD 資料夾
  const filename = `weekly/${_fetchedDate}/fro_${eventId}_${Date.now()}.jpg`;
  const file = bucket.file(filename);

  await file.save(resized, { contentType: "image/jpeg" });
  await file.makePublic();

  return file.publicUrl();
}
function getWeeklyDateRangeJST(now = new Date()) {
  // 轉 JST
  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

  // 0=Sun … 4=Thu
  const day = jst.getDay();

  // 本週三
  const thisWed = new Date(jst);
  thisWed.setDate(jst.getDate() - ((day + 4) % 7));

  // 上週四
  const lastThu = new Date(thisWed);
  lastThu.setDate(thisWed.getDate() - 6);

  const fmt = d => d.toISOString().slice(0, 10);

  return [fmt(lastThu), fmt(thisWed)];
}
export async function uploadEventImagesInternal() {
  const input = await readJson("weekly/fetched.json");
  const output = { A: [], B: [], C: [] , fetched_date:'', tags: input.tags, title_zh_short: input.title_zh_short , date_range : [] };
  output.fetched_date = _fetchedDate;
  output.date_range = getWeeklyDateRangeJST();

  for (const type of ["A", "B"]) {
    for (let i = 0; i < input[type].length; i++) {
      const item = input[type][i];
      const downloadUrl = await uploadImage(item.image, `${type}-${i + 1}`);

      output[type].push({
        ...item,
        downloadUrl
      });
    }
  }

  output.C = input.C.map(i => ({
    ...i,
    downloadUrl: null
  }));

  const filename = `weekly/finished_${_fetchedDate}.json`;
  await writeJson(filename, output);
  await compileToWordpress(_fetchedDate)
  return {
    A: output.A.length,
    B: output.B.length,
    C: output.C.length
  };
}