import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Student } from "../models/StudentModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Admin } from "../models/AdminModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateEmailTemplate } from "../utils/emailTemplate.js";
import { sendToken } from "../utils/sendToken.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import crypto from "crypto";

function getModelByRole(role) {
  switch (role) {
    case "Student": return Student;
    case "Teacher": return Teacher;
    case "Alumni":  return Alumni;
    case "Admin":   return Admin;
    default:        return null;
  }
}

// REGISTER 
export const register = catchAsyncError(async (req, res, next) => {
  try {
    const { name, password, role, enrollmentYear } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (!name || !email || !password || !role) {
      return next(new ErrorHandler("All fields are required.", 400));
    }

    const validRoles = ["Student", "Teacher", "Alumni", "Admin"];
    if (!validRoles.includes(role)) {
      return next(new ErrorHandler("Invalid role selected.", 400));
    }

    if (role === "Admin") {
      return next(
        new ErrorHandler(
          "Admin accounts cannot be self-registered. Please contact the system administrator.",
          403
        )
      );
    }

    const Model = getModelByRole(role);

    const allModels = [Student, Teacher, Alumni, Admin];
    
    for (const m of allModels) {
      const existingUser = await m.findOne({ email, accountVerified: true });
      if (existingUser) {
        return next(new ErrorHandler("Email is already registered.", 400));
      }
    }

    let totalAttempts = 0;
    for (const m of allModels) {
      const attempts = await m.find({ email, accountVerified: false });
      totalAttempts += attempts.length;
    }

    if (totalAttempts > 3) {
      return next(
        new ErrorHandler(
          "You have exceeded the maximum number of attempts (3). Please try again after an hour.",
          400
        )
      );
    }

    const userData = { name, email, password };
    // Save enrollmentYear at signup for Student and Alumni — used for "Class of YEAR" grouping
    if (enrollmentYear && (role === "Student" || role === "Alumni")) {
      userData.enrollmentYear = Number(enrollmentYear);
    }
    const user = await Model.create(userData);
    const verificationCode = user.generateVerificationCode();
    await user.save();

    sendVerificationCode(verificationCode, name, email, res);
  } catch (error) {
    next(error);
  }
});

// SEND VERIFICATION CODE
async function sendVerificationCode(verificationCode, name, email, res) {
  try {
    const message = generateEmailTemplate(verificationCode);
    await sendEmail({ email, subject: "Your Verification Code", message });
    return res.status(200).json({
      success: true,
      message: `Verification email successfully sent to ${name}`,
    });
  } catch (error) {
    console.error("OTP Send Error:", error);
    return res.status(500).json({
      success: false,
      message: "Verification code failed to send: " + (error.message || "Unknown error"),
    });
  }
}

// VERIFY OTP 
export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { otp, role } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  const Model = getModelByRole(role);
  if (!Model) {
    return next(new ErrorHandler("Invalid role.", 400));
  }

  try {
    const userAllEntries = await Model.find({
      email,
      accountVerified: false,
    }).sort({ createdAt: -1 });

    if (!userAllEntries || userAllEntries.length === 0) {
      return next(new ErrorHandler("User Not Found", 404));
    }

    let user;
    if (userAllEntries.length > 1) {
      user = userAllEntries[0];
      await Model.deleteMany({
        _id: { $ne: user._id },
        email,
        accountVerified: false,
      });
    } else {
      user = userAllEntries[0];
    }

    if (user.verificationCode !== Number(otp)) {
      return next(new ErrorHandler("Invalid OTP", 400));
    }

    const currentTime = Date.now();
    const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();

    if (currentTime > verificationCodeExpire) {
      return next(new ErrorHandler("OTP Expired.", 400));
    }

    const allModels = [Student, Teacher, Alumni, Admin];
    for (const m of allModels) {
      const existingVerified = await m.findOne({ email: user.email, accountVerified: true });
      if (existingVerified) {
        return next(new ErrorHandler("This email is already verified under another account.", 400));
      }
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({ validateModifiedOnly: true });

    sendToken(user, 200, "Account Verified", res);
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

// LOGIN
export const login = catchAsyncError(async (req, res, next) => {
  const { password, role, keepSignedIn } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  if (!email || !password || !role) {
    return next(new ErrorHandler("Email, password and role are required.", 400));
  }

  const Model = getModelByRole(role);
  if (!Model) {
    return next(new ErrorHandler("Invalid role.", 400));
  }

  const user = await Model.findOne({ email, accountVerified: true }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or Password.", 400));
  }

  // 0. Immediately reject blocked accounts — before any other check
  if (user.isBlocked) {
    return next(new ErrorHandler("Your account has been blocked by the administrator. Please contact support.", 403));
  }

  // 1. Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
    return next(new ErrorHandler(`Your account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minutes.`, 403));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    // 2. Increment failed attempts
    user.loginAttempts += 1;
    
    // Lock account if >= 3
    if (user.loginAttempts >= 3) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 mins
      user.loginAttempts = 0; // Reset attempts after lock
      await user.save({ validateModifiedOnly: true });
      return next(new ErrorHandler("You have exceeded the maximum number of failed attempts. Your account is now locked for 30 minutes.", 403));
    }
    
    await user.save({ validateModifiedOnly: true });
    return next(new ErrorHandler(`Invalid email or Password. You have ${3 - user.loginAttempts} attempts left.`, 400));
  }

  // 3. Reset failed attempts on successful login
  if (user.loginAttempts > 0 || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save({ validateModifiedOnly: true });
  }

  // keepSignedIn = true → 30 day cookie, false/undefined → 7 day cookie
  sendToken(user, 200, "User Logged In Successfully", res, !!keepSignedIn);
});

//  LOGOUT 
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

//  GET LOGGED-IN USER 
export const getUser = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  // Attach role from the model name so frontend can use it for route protection
  const role = user.constructor.modelName; // "Student" | "Teacher" | "Alumni" | "Admin"
  res.status(200).json({
    success: true,
    user: { ...user.toObject(), role },
  });
});

//  FORGOT PASSWORD 
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { role } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  const Model = getModelByRole(role);
  if (!Model) {
    return next(new ErrorHandler("Invalid role.", 400));
  }

  const user = await Model.findOne({ email, accountVerified: true });
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = `Your Reset Password Token is:- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it.`;

  try {
    sendEmail({
      email: user.email,
      subject: "Alumni Portal Reset Password",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        error.message ? error.message : "Cannot send reset password token.",
        500
      )
    );
  }
});

//  RESET PASSWORD 
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  let user = null;

  user = await Student.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) user = await Teacher.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) user = await Alumni.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) user = await Admin.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });

  if (!user) {
    return next(new ErrorHandler("Reset password token is invalid or has been expired.", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password & confirm password do not match.", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, "Password reset successfully.", res);
});

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
export const updateProfile = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;

  const allowedFields = {
    Student: ["department", "year", "section", "cgpa", "skills", "bio", "linkedIn", "github", "portfolio", "enrollmentNumber", "enrollmentYear"],
    Teacher: ["department", "designation", "subjectsTaught", "qualifications", "experience", "bio", "linkedIn", "employeeId", "joiningYear"],
    Alumni:  ["department", "degree", "enrollmentYear", "graduationYear", "currentCompany", "currentDesignation", "currentLocation", "industry", "skills", "bio", "linkedIn", "github", "availableForMentorship"],
    Admin:   ["department"],
  };

  const fields = allowedFields[role];
  if (!fields) {
    return next(new ErrorHandler("Invalid role.", 400));
  }

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      // Treat empty strings for unique sparse fields as undefined to avoid duplicate key errors
      if (req.body[field] === "" && (field === "enrollmentNumber" || field === "employeeId")) {
        user[field] = undefined;
      } else {
        user[field] = req.body[field];
      }
    }
  });

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user,
  });
});

// UPLOAD PROFILE PHOTO
export const uploadProfilePhoto = catchAsyncError(async (req, res, next) => {
  const { photo } = req.body;
  if (!photo) return next(new ErrorHandler("No photo provided.", 400));

  const user = req.user;

  if (user.profilePhoto?.public_id) {
    await deleteFromCloudinary(user.profilePhoto.public_id).catch(() => {});
  }

  const uploaded = await uploadToCloudinary(photo);
  user.profilePhoto = { public_id: uploaded.public_id, url: uploaded.url };
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Profile photo updated.",
    profilePhoto: user.profilePhoto,
  });
});
