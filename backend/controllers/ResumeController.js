import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler        from "../middlewares/error.js";
import { Student } from "../models/StudentModel.js";
import { Alumni }  from "../models/AlumniModel.js";
import crypto from "crypto";

// We store resumes as base64 strings in the user document.
// For production, swap the storage to Cloudinary/S3 here.
// Max 5 MB enforced by middleware (see router).

// POST /api/v1/resume/upload
export const uploadResume = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;

  if (!["Student", "Alumni"].includes(role)) {
    return next(new ErrorHandler("Only students and alumni can upload resumes.", 403));
  }

  if (!req.file) {
    return next(new ErrorHandler("No file uploaded. Please attach a PDF.", 400));
  }

  if (req.file.mimetype !== "application/pdf") {
    return next(new ErrorHandler("Only PDF files are accepted.", 400));
  }

  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  if (req.file.size > MAX_BYTES) {
    return next(new ErrorHandler("File size cannot exceed 5 MB.", 400));
  }

  // Generate a public_id (acts as a download token)
  const public_id     = crypto.randomBytes(16).toString("hex");
  const base64Data    = req.file.buffer.toString("base64");
  const dataUrl       = `data:application/pdf;base64,${base64Data}`;

  const Model = role === "Student" ? Student : Alumni;

  await Model.findByIdAndUpdate(user._id, {
    "resume.public_id":    public_id,
    "resume.url":          dataUrl,
    "resume.originalName": req.file.originalname,
    "resume.uploadedAt":   new Date(),
  });

  res.status(200).json({
    success:      true,
    message:      "Resume uploaded successfully.",
    originalName: req.file.originalname,
    uploadedAt:   new Date(),
  });
});

// GET /api/v1/resume/me — get own resume metadata
export const getMyResume = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;

  if (!["Student", "Alumni"].includes(role)) {
    return next(new ErrorHandler("Only students and alumni have resumes.", 403));
  }

  const Model = role === "Student" ? Student : Alumni;
  const doc   = await Model.findById(user._id).select("resume").lean();

  if (!doc?.resume?.url) {
    return res.status(200).json({ success: true, resume: null });
  }

  // Return metadata only — not the full base64 blob
  res.status(200).json({
    success: true,
    resume: {
      originalName: doc.resume.originalName,
      uploadedAt:   doc.resume.uploadedAt,
      hasResume:    true,
    },
  });
});

// GET /api/v1/resume/download — download own resume as PDF
export const downloadResume = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;

  if (!["Student", "Alumni"].includes(role)) {
    return next(new ErrorHandler("Only students and alumni have resumes.", 403));
  }

  const Model = role === "Student" ? Student : Alumni;
  const doc   = await Model.findById(user._id).select("resume").lean();

  if (!doc?.resume?.url) {
    return next(new ErrorHandler("No resume uploaded yet.", 404));
  }

  // Strip data URI prefix and convert back to buffer
  const base64 = doc.resume.url.replace(/^data:application\/pdf;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${doc.resume.originalName || "resume.pdf"}"`
  );
  res.send(buffer);
});

// DELETE /api/v1/resume — delete own resume
export const deleteResume = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;

  if (!["Student", "Alumni"].includes(role)) {
    return next(new ErrorHandler("Only students and alumni have resumes.", 403));
  }

  const Model = role === "Student" ? Student : Alumni;
  await Model.findByIdAndUpdate(user._id, {
    "resume.public_id":    null,
    "resume.url":          null,
    "resume.originalName": null,
    "resume.uploadedAt":   null,
  });

  res.status(200).json({ success: true, message: "Resume deleted." });
});
