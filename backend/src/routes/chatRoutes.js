import express from "express";
import {
  chat,
  getChatHistory,
  clearChatHistory,
  getPersonalizedRecommendations, // Thêm hàm này vào
} from "../controllers/chatController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  checkSpam,
  checkMessageLength,
  checkCooldown,
  getRateLimitStatus,
} from "../middleware/rateLimiter.js";

const router = express.Router();

// 1. Lấy trạng thái giới hạn lượt chat
router.get("/rate-limit", isAuthenticated, getRateLimitStatus);

// 2. Lấy gợi ý sản phẩm thông minh cho Trang chủ (Mới)
// Route này nên để GET vì nó chỉ lấy dữ liệu, không thay đổi dữ liệu
router.get("/recommendations", getPersonalizedRecommendations);

// 3. Xử lý nhắn tin với AI (Đã gộp middleware và xóa bỏ route trùng lặp)
router.post(
  "/",
  // isAuthenticated, 
  checkMessageLength, 
  checkCooldown, 
  checkSpam, 
  chat, 
);

// 4. Quản lý lịch sử chat
router.get("/history", isAuthenticated, getChatHistory);
router.delete("/history", isAuthenticated, clearChatHistory);

export default router;
