import express from "express";
import { createOrUpdateReview, getReviewsByProduct, getAllReviews, deleteReview } from "../controllers/reviewController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.get("/product/:productId", getReviewsByProduct);
router.post("/", isAuthenticated, createOrUpdateReview);

// Admin
router.get("/", isAuthenticated, isAdmin, getAllReviews);
router.delete("/:id", isAuthenticated, isAdmin, deleteReview);

export default router;
