import { fetchNikkansports } from "./nikkansports.js";
import { fetchGekisaka } from "./gekisaka.js";
import { fetchYahoo } from "./yahoo.js";

export async function fetchAllRss() {
  const results = await Promise.all([
    fetchNikkansports(),
    fetchGekisaka(),
    fetchYahoo()
  ]);

  return results.flat();
}