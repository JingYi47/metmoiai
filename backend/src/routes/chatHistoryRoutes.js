import express from "express";
import {
  getChatHistory,
  clearChatHistory,
} from "../controllers/chatController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

// Lấy lịch sử chat
router.get("/history", isAuthenticated, getChatHistory);

// Xóa lịch sử chat
router.delete("/history", isAuthenticated, clearChatHistory);

export default router;
