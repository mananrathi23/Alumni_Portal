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
import { createLimiter, ipAndEmailKey } from "../utils/rateLimiter.js";

const router = express.Router();

// Auth rate limiters: only on sensitive routes (login, register, OTP)
// Per IP + email: stops brute-forcing one account without locking out a whole
// campus that shares one public IP. The per-IP ceiling catches mass abuse.
const authLimiter = createLimiter({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: ipAndEmailKey,
  message: "Too many attempts, please try again in 15 minutes.",
});
const authIpLimiter = createLimiter({
  name: "auth-ip",
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many attempts from this network, please try again later.",
});

router.post("/register",            authIpLimiter, authLimiter, register);
router.post("/otp-verification",    authIpLimiter, authLimiter, verifyOTP);
router.post("/login",               authIpLimiter, authLimiter, login);
router.post("/password/forgot",     authIpLimiter, authLimiter, forgotPassword);
router.put("/password/reset/:token",             resetPassword);

// These are NOT rate-limited (called on every page load)
router.get("/logout",         isAuthenticated, logout);
router.get("/me",             isAuthenticated, getUser);
router.put("/update-profile", isAuthenticated, updateProfile);
router.post("/upload-photo",  isAuthenticated, uploadProfilePhoto);

export default router;