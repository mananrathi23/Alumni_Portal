import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Student } from "../models/StudentModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Alumni } from "../models/AlumniModel.js";

// Helper to get model
function getModelByRole(role) {
  switch (role) {
    case "Student": return Student;
    case "Teacher": return Teacher;
    case "Alumni":  return Alumni;
    default:        return null;
  }
}

// ── GET ALL USERS ──────────────────────────────────────────────────────────
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const students = await Student.find().select("-password").lean();
  const teachers = await Teacher.find().select("-password").lean();
  const alumni   = await Alumni.find().select("-password").lean();

  const allUsers = [
    ...students.map(u => ({ ...u, role: "Student" })),
    ...teachers.map(u => ({ ...u, role: "Teacher" })),
    ...alumni.map(u => ({ ...u, role: "Alumni" })),
  ];

  // Sort by newest first
  allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({
    success: true,
    users: allUsers,
  });
});

// ── TOGGLE VERIFY ──────────────────────────────────────────────────────────
export const toggleVerifyUser = catchAsyncError(async (req, res, next) => {
  const { role, id } = req.params;
  const Model = getModelByRole(role);
  if (!Model) return next(new ErrorHandler("Invalid role", 400));

  const user = await Model.findById(id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.adminVerified = !user.adminVerified;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: `User ${user.adminVerified ? "verified" : "unverified"} successfully.`,
    user: { ...user.toObject(), role }
  });
});

// ── TOGGLE BLOCK ───────────────────────────────────────────────────────────
export const toggleBlockUser = catchAsyncError(async (req, res, next) => {
  const { role, id } = req.params;
  const Model = getModelByRole(role);
  if (!Model) return next(new ErrorHandler("Invalid role", 400));

  const user = await Model.findById(id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.isBlocked = !user.isBlocked;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully.`,
    user: { ...user.toObject(), role }
  });
});
