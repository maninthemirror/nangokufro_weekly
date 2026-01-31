import fs from "fs/promises";

export async function loadJson(filename) {
  const raw = await fs.readFile(`/tmp/${filename}`, "utf-8");
  return JSON.parse(raw);
}