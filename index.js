import { onRequest } from "firebase-functions/v2/https";
import { fetchFrontaleRssInternal } from "./steps/fetchFrontaleRss.js";
import { parseFrontaleListInternal } from "./steps/parseFrontaleList.js";
import { buildFrontaleWeeklyDatasetInternal } from "./steps/buildFrontaleWeeklyDataset.js";
import { classifyFrontaleEventsInternal } from "./steps/classifyFrontaleEvents.js";
import { semanticMergeFrontaleEventsInternal } from "./steps/semanticMergeFrontaleEvents.js";
import { selectWeeklyFrontaleEventsInternal } from "./steps/selectWeeklyFrontaleEvents.js";
import { fetchArticleContentInternal } from "./steps/fetchArticleContent.js";
import { uploadEventImagesInternal } from "./steps/uploadEventImages.js";

async function runFakeLogic() {
  await uploadEventImagesInternal();
}

async function runWeeklyLogic() {
  await buildFrontaleWeeklyDatasetInternal();
  await parseFrontaleListInternal();
  await classifyFrontaleEventsInternal();
  await semanticMergeFrontaleEventsInternal();
  await selectWeeklyFrontaleEventsInternal();
  await fetchArticleContentInternal();
  await uploadEventImagesInternal();
}

export const runDailyRssPipeline = onRequest(
  { region: "asia-east1", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      await fetchFrontaleRssInternal();
      res.status(200).json({ status: "success" });
    } catch (error) {
      console.error("Error in runDailyRssPipeline:", error);
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);

export const runWeeklyPipeline = onRequest(
  { region: "asia-east1", timeoutSeconds: 300 },
  async (req, res) => {
    try {
      await runWeeklyLogic();
      res.status(200).json({ status: "success" });
    } catch (error) {
      console.error("Error in runWeeklyPipeline:", error);
      res.status(500).json({ status: "error", message: error.message });
    }
  }
);


export const runFakePipeline = onRequest(
  { region: "asia-east1", timeoutSeconds: 300 },
  (req, res) => runFakeLogic().then(() => res.json({ ok: true })) // For testing, can be left as is or updated
);