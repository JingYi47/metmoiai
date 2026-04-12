import express from "express";
import {
  listProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  getNewArrivals,
  searchProducts,
  getDiscountedProducts,
  getFeaturedProducts,
  hideProduct,
  showProduct,
  getProductImages,
  getProductByColor,
  addColorImage,
  deleteProductColorImage,
  restoreProduct,
  updateColorStock,
  getRelatedProducts,
  getTrendingProducts,
  getAIProducts,
  aiSearchProducts, // 🔥 THÊM IMPORT NÀY
} from "../controllers/productController.js";

import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// ==================== PUBLIC API (KHÔNG CÓ THAM SỐ ĐỘNG) ====================
router.get("/", listProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/search", searchProducts);
router.get("/on-sale", getDiscountedProducts);
router.get("/featured", getFeaturedProducts);
router.get("/trending", getTrendingProducts);
router.get("/ai-search", aiSearchProducts); // 🔥 ĐẶT Ở ĐÂY, TRƯỚC /:id

// ==================== API CÓ THAM SỐ ĐỘNG (ĐỂ SAU) ====================
router.get("/slug/:slug", getProductBySlug);
router.get("/:id/recommend", getRelatedProducts);
router.get("/:id/images", getProductImages);
router.get("/:id/color/:colorName", getProductByColor);
router.get("/:id", getProductById); // Cái này để CUỐI CÙNG

// ==================== ADMIN API ====================
router.get("/admin", isAuthenticated, isAdmin, listProducts);
router.post("/", isAuthenticated, isAdmin, createProduct);
router.put("/:id", isAuthenticated, isAdmin, updateProduct);
router.delete("/:id", isAuthenticated, isAdmin, deleteProduct);
router.put("/:id/disable", isAuthenticated, isAdmin, hideProduct);
router.put("/:id/enable", isAuthenticated, isAdmin, showProduct);
router.patch("/:id/restore", isAuthenticated, isAdmin, restoreProduct);
router.get("/ai-recommend", isAuthenticated, getAIProducts);

router.post(
  "/:id/images",
  isAuthenticated,
  isAdmin,
  upload.single("image"),
  addProductImage,
);

router.put(
  "/:id/color/:colorName/stock",
  isAuthenticated,
  isAdmin,
  updateColorStock,
);

router.post(
  "/:id/color/:colorName/image",
  isAuthenticated,
  isAdmin,
  upload.single("image"),
  addColorImage,
);

router.delete(
  "/:id/color/:colorName/image",
  isAuthenticated,
  isAdmin,
  deleteProductColorImage,
);

router.delete("/:id/images", isAuthenticated, isAdmin, deleteProductImage);

export default router;
