import express from "express";
import {
  loginWithGoogle,
  register,
  verifyEmailToken,
  resendVerificationEmail,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlist,
  toggleWishlist,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
// import { isAdmin } from "../middleware/isAdmin.js";

const router = express.Router();

router.post("/google", loginWithGoogle);
router.post("/register", express.urlencoded({ extended: true }), register);
router.get("/verify", verifyEmailToken);
router.post("/resend-verification", resendVerificationEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.get("/profile", isAuthenticated, getProfile);
router.put("/profile", isAuthenticated, updateProfile);
router.put("/change-password", isAuthenticated, changePassword);
router.post("/wishlist", isAuthenticated, addToWishlist);
router.delete("/wishlist/:productId", isAuthenticated, removeFromWishlist);
router.get("/wishlist", isAuthenticated, getWishlist);
router.get("/wishlist/check/:productId", isAuthenticated, checkWishlist);
router.post("/wishlist/toggle", isAuthenticated, toggleWishlist);

export default router;
