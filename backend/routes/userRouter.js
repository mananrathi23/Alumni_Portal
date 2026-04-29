import express from "express";
import {
  register,
  verifyOTP,
  login,
  logout,
  getUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  uploadProfilePhoto,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Auth rate limiter: only on sensitive routes (login, register, OTP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again in 15 minutes." },
});

router.post("/register",            authLimiter, register);
router.post("/otp-verification",    authLimiter, verifyOTP);
router.post("/login",               authLimiter, login);
router.post("/password/forgot",     authLimiter, forgotPassword);
router.put("/password/reset/:token",             resetPassword);

// These are NOT rate-limited (called on every page load)
router.get("/logout",         isAuthenticated, logout);
router.get("/me",             isAuthenticated, getUser);
router.put("/update-profile", isAuthenticated, updateProfile);
router.post("/upload-photo",  isAuthenticated, uploadProfilePhoto);

export default router;