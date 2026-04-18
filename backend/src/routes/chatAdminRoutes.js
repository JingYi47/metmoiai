import express from "express";
import {
  getUserChatHistory,
  getAdminConversations,
  uploadChatAttachment,
  markAsRead,
} from "../controllers/chatAdminController.js";
import { isAuthenticated, isAdmin } from "../middleware/isAuthenticated.js";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// User routes
router.get("/history", isAuthenticated, getUserChatHistory);
router.post("/upload", isAuthenticated, upload.single("file"), uploadChatAttachment);
router.post("/mark-read/:conversationId", isAuthenticated, markAsRead);

// Admin routes
router.get("/conversations", isAuthenticated, isAdmin, getAdminConversations);

export default router;
