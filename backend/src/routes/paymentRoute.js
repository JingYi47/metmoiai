import express from "express";
import {
  createVnpayPayment,
  vnpayReturn,
  vnpayIPN,
} from "../controllers/vnpayController.js";
import {
  createMomoPayment,
  ipnCallback,
  handleCallback,
  simulateCallback,
} from "../controllers/momoController.js";

import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

// router.post("/create", isAuthenticated, createPayment);
router.post("/vnpay/create/:id", isAuthenticated, createVnpayPayment);
router.get("/vnpay/return", vnpayReturn);
router.get("/vnpay-callback", vnpayReturn);
router.get("/vnpay-return", vnpayReturn);
router.get("/vnpay-ipn", vnpayIPN);
router.get("/vnpay/ipn", vnpayIPN);

router.post("/momo/create/:id", isAuthenticated, createMomoPayment);
router.post("/momo/ipn", ipnCallback);
router.get("/momo/return", handleCallback);
router.post("/momo/simulate", simulateCallback);

export default router;
