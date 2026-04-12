import express from "express";
import { trackBehavior } from "../controllers/behaviorController.js";

const router = express.Router();

router.post("/track", trackBehavior);

export default router;
