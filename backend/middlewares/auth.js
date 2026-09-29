import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import { Admin } from "../models/AdminModel.js";
import { isTokenBlacklisted } from "../utils/tokenBlacklist.js";
import { getModelByRole } from "../utils/userModels.js";

const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  // Check cookie first, then Authorization header (for cross-domain & tests)
  let token = req.cookies?.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 401));
  }

  // ✅ JWT now contains both id AND role (set in each model's generateToken)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // Check blacklist using the token's jti (JWT ID)
  if (decoded.jti && await isTokenBlacklisted(decoded.jti)) {
    return next(new ErrorHandler("Token is no longer valid. Please log in again.", 401));
  }

  const Model = getModelByRole(decoded.role);
  if (!Model) {
    return next(new ErrorHandler("Invalid role in token.", 401));
  }

  // ✅ Find user in the correct collection using role from token
  // Fetch full document (no .select restriction) so updateProfile can read/write all fields
  req.user = await Model.findById(decoded.id);

  if (!req.user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (req.user.isBlocked) {
    return next(new ErrorHandler("Your account has been blocked by an administrator.", 403));
  }

  // ── Fire-and-forget: log IP + last seen (adds zero latency) ──────────────
  // Throttled: only write when the IP changed or lastSeenAt is stale, so a busy
  // user doesn't cause a DB write on every single API request.
  // req.ip honours `trust proxy` (the address Nginx saw); the first
  // X-Forwarded-For entry is client-controlled and can be faked
  const ip = req.ip || req.socket?.remoteAddress || null;
  const lastSeenMs = req.user.lastSeenAt ? new Date(req.user.lastSeenAt).getTime() : 0;
  if (ip !== req.user.lastIP || Date.now() - lastSeenMs > LAST_SEEN_THROTTLE_MS) {
    Model.findByIdAndUpdate(decoded.id, {
      $set: { lastIP: ip, lastSeenAt: new Date() },
    }).exec().catch(() => {});
  }

  next();
});

// ── isAdmin: only allow if role is Admin ──────────────────────────────────────
export const isAdmin = catchAsyncError(async (req, res, next) => {
  let token = req.cookies?.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  if (decoded.jti && await isTokenBlacklisted(decoded.jti)) {
    return next(new ErrorHandler("Token is no longer valid. Please log in again.", 401));
  }

  if (decoded.role !== "Admin") {
    return next(new ErrorHandler("Access denied. Admins only.", 403));
  }

  const admin = await Admin.findById(decoded.id);
  if (!admin) {
    return next(new ErrorHandler("Admin not found.", 404));
  }

  req.user = admin;
  next();
});

// ── requireAdminPermission: fine-grained admin access ─────────────────────────
// Usage: router.post(..., isAuthenticated, isAdmin, requireAdminPermission("manageNews"), handler)
export const requireAdminPermission = (permKey) =>
  catchAsyncError(async (req, res, next) => {
    const admin = req.user;
    if (!admin || admin.constructor?.modelName !== "Admin") {
      return next(new ErrorHandler("Access denied. Admins only.", 403));
    }
    if (!admin.permissions || admin.permissions[permKey] !== true) {
      return next(new ErrorHandler("Access denied. Insufficient permissions.", 403));
    }
    next();
  });
// ── isStaff: allow Admin, Alumni, Teacher — block Students ───────────────────
// Used for event/job create + edit routes
export const isStaff = (req, res, next) => {
  const role = req.user?.constructor?.modelName;
  if (!role || role === "Student") {
    return next(new ErrorHandler("Students cannot post events or jobs.", 403));
  }
  next();
};

// ── isVerifiedByAdmin: block unverified users from core features ──────────────
export const isVerifiedByAdmin = (req, res, next) => {
  const user = req.user;
  // Admins are always allowed through
  const role = user?.constructor?.modelName || "";
  if (role === "Admin") return next();

  // For all other roles: must be admin-verified
  // adminVerified could be true/false/undefined — treat undefined as not verified
  if (!user?.adminVerified) {
    return next(new ErrorHandler(
      "Your account is pending admin verification. You cannot perform this action.",
      403
    ));
  }
  next();
};