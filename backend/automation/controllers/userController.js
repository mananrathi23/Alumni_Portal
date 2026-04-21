import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Student } from "../models/StudentModel.js";
import { Teacher } from "../models/TeacherModel.js";
import { Alumni } from "../models/AlumniModel.js";
import { Admin } from "../models/AdminModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateEmailTemplate } from "../utils/emailTemplate.js";
import { sendToken } from "../utils/sendToken.js";
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
    const { name, email, phone, password, verificationMethod, role } = req.body;

    if (!name || !email || !phone || !password || !verificationMethod || !role) {
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

    function validatePhoneNumber(phone) {
      const phoneRegex = /^\+91[6-9]\d{9}$/;
      return phoneRegex.test(phone);
    }
    if (!validatePhoneNumber(phone)) {
      return next(new ErrorHandler("Invalid phone number.", 400));
    }

    const Model = getModelByRole(role);

    const existingUser = await Model.findOne({
      $or: [
        { email, accountVerified: true },
        { phone, accountVerified: true },
      ],
    });
    if (existingUser) {
      return next(new ErrorHandler("Phone or Email is already used.", 400));
    }

    const registrationAttemptsByUser = await Model.find({
      $or: [
        { phone, accountVerified: false },
        { email, accountVerified: false },
      ],
    });
    if (registrationAttemptsByUser.length > 3) {
      return next(
        new ErrorHandler(
          "You have exceeded the maximum number of attempts (3). Please try again after an hour.",
          400
        )
      );
    }

    const user = await Model.create({ name, email, phone, password });
    const verificationCode = user.generateVerificationCode();
    await user.save();

    sendVerificationCode(verificationMethod, verificationCode, name, email, phone, res);
  } catch (error) {
    next(error);
  }
});

// SEND VERIFICATION CODE
async function sendVerificationCode(
  verificationMethod,
  verificationCode,
  name,
  email,
  phone,
  res
) {
  try {
    if (verificationMethod === "email") {
      const message = generateEmailTemplate(verificationCode);
      sendEmail({ email, subject: "Your Verification Code", message });
      res.status(200).json({
        success: true,
        message: `Verification email successfully sent to ${name}`,
      });
    } else if (verificationMethod === "phone") {
      const verificationCodeWithSpace = verificationCode
        .toString()
        .split("")
        .join(" ");
      await client.calls.create({
        twiml: `<Response><Say>Your verification code is ${verificationCodeWithSpace}. Your verification code is ${verificationCodeWithSpace}.</Say></Response>`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      res.status(200).json({
        success: true,
        message: `OTP sent.`,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Invalid verification method.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Verification code failed to send.",
    });
  }
}

// VERIFY OTP 
export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp, phone, role } = req.body;

  function validatePhoneNumber(phone) {
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
  if (!validatePhoneNumber(phone)) {
    return next(new ErrorHandler("Invalid phone number.", 400));
  }

  const Model = getModelByRole(role);
  if (!Model) {
    return next(new ErrorHandler("Invalid role.", 400));
  }

  try {
    const userAllEntries = await Model.find({
      $or: [
        { email, accountVerified: false },
        { phone, accountVerified: false },
      ],
    }).sort({ createdAt: -1 });

    if (!userAllEntries || userAllEntries.length === 0) {
      return next(new ErrorHandler("User Not Found", 404));
    }

    let user;
    if (userAllEntries.length > 1) {
      user = userAllEntries[0];
      await Model.deleteMany({
        _id: { $ne: user._id },
        $or: [
          { phone, accountVerified: false },
          { email, accountVerified: false },
        ],
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
  const { email, password, role } = req.body;

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

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or Password.", 400));
  }

  sendToken(user, 200, "User Logged In Successfully", res);
});

//  LOGOUT 
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .clearCookie("token", {
      httpOnly: true,
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
  res.status(200).json({
    success: true,
    user,
  });
});

//  FORGOT PASSWORD 
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email, role } = req.body;

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
// In userController.js — replace ONLY the resetPassword function

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // ✅ Search all 4 collections
  // resetPasswordToken is unique so it will only match one user in one collection
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
// Called from dashboard after login — student/teacher fills in department, year, etc.
// PUT /api/v1/user/update-profile
export const updateProfile = catchAsyncError(async (req, res, next) => {
  const user = req.user;                    // set by isAuthenticated middleware
  const role = user.constructor.modelName; // "Student" | "Teacher" | "Alumni" | "Admin"

  const allowedFields = {
    Student: ["department", "year", "section", "cgpa", "skills", "bio", "linkedIn", "github", "enrollmentNumber"],
    Teacher: ["department", "designation", "subjectsTaught", "qualifications", "experience", "bio", "linkedIn", "employeeId"],
    Alumni:  ["department", "degree", "graduationYear", "currentCompany", "currentDesignation", "currentLocation", "industry", "skills", "bio", "linkedIn", "github", "availableForMentorship"],
    Admin:   ["department"],
  };

  const fields = allowedFields[role];
  if (!fields) {
    return next(new ErrorHandler("Invalid role.", 400));
  }

  // Only update fields that were actually sent — ignore everything else
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user,
  });
});