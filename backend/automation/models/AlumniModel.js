import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const alumniSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required."],
  },
  email: {
    type: String,
    required: [true, "Email is required."],
  },
  phone: String,
  password: {
    type: String,
    minLength: [8, "Password must have at least 8 characters."],
    maxLength: [32, "Password cannot have more than 32 characters."],
    select: false,
  },

  // ── Alumni-Specific Fields ───────────────────────────────
  graduationYear: { type: Number, default: new Date().getFullYear() },
  department: { type: String, default: "Not Set" },
  degree: String, // e.g. "B.Tech", "MBA"
  currentCompany: String,
  currentDesignation: String,
  currentLocation: String,
  industry: String, // e.g. "IT", "Finance"
  skills: [String],
  bio: { type: String, maxLength: [500, "Bio cannot exceed 500 characters."] },
  profilePhoto: { public_id: String, url: String },
  linkedIn: String,
  github: String,
  availableForMentorship: { type: Boolean, default: false },

  // ── Auth Fields ──────────────────────────────────────────
  accountVerified: { type: Boolean, default: false },
  verificationCode: Number,
  verificationCodeExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
alumniSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare entered password with hashed password
alumniSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate 5-digit OTP
alumniSchema.methods.generateVerificationCode = function () {
  const firstDigit = Math.floor(Math.random() * 9) + 1;
  const remainingDigits = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const verificationCode = parseInt(firstDigit + remainingDigits);
  this.verificationCode = verificationCode;
  this.verificationCodeExpire = Date.now() + 10 * 60 * 1000;
  return verificationCode;
};

// Generate JWT — includes role so backend knows who is logged in
alumniSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: "Alumni" },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Generate reset password token
alumniSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

export const Alumni = mongoose.model("Alumni", alumniSchema);