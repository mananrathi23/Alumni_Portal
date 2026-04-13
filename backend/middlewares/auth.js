import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import { Student } from "../models/StudentModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Admin } from "../models/AdminModel.js";

function getModelByRole(role) {
  switch (role) {
    case "Student": return Student;
    case "Teacher": return Teacher;
    case "Alumni":  return Alumni;
    case "Admin":   return Admin;
    default:        return null;
  }
}

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 400));
  }

  // ✅ JWT now contains both id AND role (set in each model's generateToken)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const Model = getModelByRole(decoded.role);
  if (!Model) {
    return next(new ErrorHandler("Invalid role in token.", 400));
  }

  // ✅ Find user in the correct collection using role from token
  req.user = await Model.findById(decoded.id);

  if (!req.user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  next();
});

// ── isAdmin: only allow if role is Admin ──────────────────────────────────────
export const isAdmin = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

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
// ── isStaff: allow Admin, Alumni, Teacher — block Students ───────────────────
// Used for event/job create + edit routes
export const isStaff = (req, res, next) => {
  const role = req.user?.constructor?.modelName;
  if (!role || role === "Student") {
    return next(new ErrorHandler("Students cannot post events or jobs.", 403));
  }
  next();
};
