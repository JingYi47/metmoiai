import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";
import {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserRole,
  lockUser,
  unlockUser,
} from "../controllers/userAdminController.js";

const router = express.Router();

router.use(isAuthenticated, isAdmin);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.delete("/:id/delete", deleteUser);
router.put("/:id/role", updateUserRole);
router.put("/:id/lock", lockUser);
router.put("/:id/unlock", unlockUser);

export default router;
