import express from "express";
import { getPersonalizedRecommendations } from "../controllers/recommendController.js";

const router = express.Router();

router.get("/home", getPersonalizedRecommendations);

export default router;
