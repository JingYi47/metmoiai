import express from "express";
import {
  getCart,
  addToCart,
  updateQuantity,
  toggleSelectItem,
  removeItem,
  clearCart,
} from "../controllers/cartController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

// phải đăng nhập mới dc thêm giỏ hàng

router.use(isAuthenticated);
router.get("/", getCart);
router.post("/add", addToCart);
router.put("/quantity/:itemId", updateQuantity);
router.patch("/toggle/:itemId", toggleSelectItem);
router.delete("/item/:itemId", removeItem);
router.delete("/clear", clearCart);

export default router;
