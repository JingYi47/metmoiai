import express from "express";
import {
  createCheckout,
  getMyCheckouts,
  getOneCheckout,
  updateCheckoutStatus,
  getAllCheckouts,
  getAvailableCoupons,
} from "../controllers/checkoutController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// User
router.post("/", isAuthenticated, createCheckout);
router.get("/me", isAuthenticated, getMyCheckouts);
router.get("/:id", isAuthenticated, getOneCheckout);
router.post("/coupons", isAuthenticated, getAvailableCoupons);

// Admin
router.get("/admin/all", isAuthenticated, isAdmin, getAllCheckouts);
router.put("/:id/status", isAuthenticated, isAdmin, updateCheckoutStatus);

export default router;
