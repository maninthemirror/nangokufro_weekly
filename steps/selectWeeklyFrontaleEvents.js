// Step 6：selectWeeklyFrontaleEvents
import { readJson, writeJson } from "../utils/storage.js";

const LIMITS = { A: 5, B: 5, C: 3 };
const TYPE_WEIGHT = { A: 20, B: 10, C: 0 };

function isDiaryOnly(event) {
  const sources = event.signal?.sources || [];
  return sources.length === 1 && sources[0] === "whats_new";
}
function selectTopEvents(events = [], type) {
  let list = events.map(e => ({
    ...e,
    score: calcScore(e)
  }));

  if (type === "B") {
    list.sort((a, b) => {
      const aDiary = isDiaryOnly(a);
      const bDiary = isDiaryOnly(b);

      // RSS 優先
      if (aDiary && !bDiary) return 1;
      if (!aDiary && bDiary) return -1;

      // 同類型再比分數
      return b.score - a.score;
    });
  } else {
    list.sort((a, b) => b.score - a.score);
  }

  return list.slice(0, LIMITS[type]);
}
function calcScore(event) {
  const articleCount = event.articles?.length || 0;
  const sourceCount = event.signal?.sources?.length || 0;
  const typeWeight = TYPE_WEIGHT[event.type] || 0;
  return articleCount * 10 + sourceCount * 5 + typeWeight;
}

export async function selectWeeklyFrontaleEventsInternal() {
  const input = await readJson("weekly/semantic.json");

  const result = {
    meta: {
      selectedAt: new Date().toISOString(),
      limits: LIMITS
    },
    events: {
        A: selectTopEvents(input.events?.A || [], "A"),
        B: selectTopEvents(input.events?.B || [], "B"),
        C: selectTopEvents(input.events?.C || [], "C")
    }
  };

  await writeJson("weekly/selected.json", result);
  return {
    A: result.events.A.length,
    B: result.events.B.length,
    C: result.events.C.length
  };
}