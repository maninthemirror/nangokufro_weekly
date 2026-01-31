// Step3

import { getWeeklyRange } from "../utils/time.js";
import { readJson, writeJson } from "../utils/storage.js";

export async function buildFrontaleWeeklyDatasetInternal() {
  const { start, end } = getWeeklyRange();

  const rss = (await readJson("weekly/fetch_rss.json")) || [];
  const official = (await readJson("weekly/fetch_official.json")) || [];

  const filteredRss = rss.filter(e => {
    const d = new Date(e.published);
    return d >= start && d <= end;
  });

  const merged = [...filteredRss, ...official];

  await writeJson("weekly/merged.json", merged);

  // side effect，2026-01-30先不清空，檢查中
  await writeJson("weekly/fetch_rss.json", []);
  await writeJson("weekly/fetch_official.json", []);

  return { merged: merged.length };
}