import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  updateCategory,
  deleteCategory,
  restoreCategory,
  getProductsByCategory,
  getCategoriesWithCount,
  getFeaturedCategories,
  getCategoryWithHighlightProducts,
} from "../controllers/categoryController.js";

import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { uploadCategory } from "../middleware/uploadCategory.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/with-count", getCategoriesWithCount);
router.get("/featured", getFeaturedCategories);

// 🔥 specific trước
router.get("/slug/:slug", getCategoryBySlug);
router.get("/:slug/products", getProductsByCategory);
router.get("/:slug/highlight-products", getCategoryWithHighlightProducts);

// 🔥 ID để cuối
router.get("/:id", getCategoryById);

// 🔥 CRUD
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  uploadCategory.single("image"),
  createCategory,
);
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  uploadCategory.single("image"),
  updateCategory,
);
router.delete("/:id", isAuthenticated, isAdmin, deleteCategory);
router.patch("/:id/restore", isAuthenticated, isAdmin, restoreCategory);

export default router;
