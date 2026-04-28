import express from "express";
import multer from "multer";
import {
  syncAIData,
  smartSearch,
  difySmartSearch,
  visualSearch,
  getAIStatus,
  clearCache,
  getTrendingSearches,
} from "../controllers/aiController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// PUBLIC API
router.get("/dify-smart-search", difySmartSearch);
router.get("/search", smartSearch);
router.post("/visual-search", upload.single("image"), visualSearch);
router.get("/status", getAIStatus);
router.get("/trending", getTrendingSearches);

// ADMIN API
router.post("/sync", syncAIData);
router.delete("/cache", clearCache);

export default router;
