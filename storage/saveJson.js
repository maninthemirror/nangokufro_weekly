import fs from "fs/promises";

export async function saveJson(filename, data) {
  await fs.writeFile(`/tmp/${filename}`, JSON.stringify(data, null, 2));
}