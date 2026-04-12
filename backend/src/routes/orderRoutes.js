import express from "express";
import {
  getMyOrders,
  getOrderById,
  createOrderFromCheckoutController,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
} from "../controllers/orderController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.get("/me", isAuthenticated, getMyOrders);
router.get("/:id", isAuthenticated, getOrderById);
router.post(
  "/from-checkout/:checkoutId",
  isAuthenticated,
  createOrderFromCheckoutController,
);
router.get("/", isAuthenticated, isAdmin, getAllOrders);
router.patch("/:id/status", isAuthenticated, isAdmin, updateOrderStatus);
router.put("/:id/payment-status", isAuthenticated, isAdmin, updatePaymentStatus);
router.put("/:id/cancel", isAuthenticated, cancelOrder);

export default router;
