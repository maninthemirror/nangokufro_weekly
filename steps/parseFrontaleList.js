// Step 2：parseFrontaleList（官方 C 類）

import fetch from "node-fetch";
import { load } from "cheerio";
import { getWeeklyRange, toJST } from "../utils/time.js";
import { writeJson } from "../utils/storage.js";

const OUTPUT = "weekly/fetch_official.json";

export async function parseFrontaleListInternal() {
  const { start, end } = getWeeklyRange();
  const urls = [
    { url: "https://www.frontale.co.jp/info/", source: "info" },
    { url: "https://www.frontale.co.jp/whats_new/", source: "whats_new" },
  ];

  let results = [];

  for (const u of urls) {
    const html = await fetch(u.url).then(r => r.text());
    const $ = load(html);

    $("section.archive_list > ul > li").each((_, block) => {
      const dateText = $(block).find("h3").first().text().trim();
      if (!dateText) return;

      const date = toJST(new Date(dateText));
      if (date < start || date > end) return;

      $(block).find("ul > li > a").each((_, a) => {
        const title = $(a).text().trim();
        const link = $(a).attr("href");
        if (!title || !link) return;

        results.push({
          title,
          url: link.startsWith("http")
            ? link
            : `https://www.frontale.co.jp${link}`,
          source: u.source,
        });
      });
    });
  }

  await writeJson(OUTPUT, results);
  return { count: results.length };
}