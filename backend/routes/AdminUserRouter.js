import express from "express";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";
import {
  getAllUsers,
  toggleVerifyUser,
  toggleBlockUser,
} from "../controllers/AdminUserController.js";

const router = express.Router();

// Apply auth middlewares
router.use(isAuthenticated, isAdmin);

router.get("/", getAllUsers);
router.put("/:role/:id/verify", toggleVerifyUser);
router.put("/:role/:id/block", toggleBlockUser);

export default router;
