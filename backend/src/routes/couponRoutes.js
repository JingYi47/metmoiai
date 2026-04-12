import express from "express";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllCoupons,
  getPublicCoupons,
  applyCoupon,
} from "../controllers/couponController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

// Public
router.get("/public", getPublicCoupons);
router.post("/apply", isAuthenticated, applyCoupon);

// Admin
router.use(isAuthenticated, isAdmin);
router.post("/", createCoupon);
router.get("/", getAllCoupons);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
