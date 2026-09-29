import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler        from "../middlewares/error.js";
import { Announcement }    from "../models/AnnouncementModel.js";

// GET /api/v1/announcements — public: returns active, unexpired announcements
export const getAnnouncements = catchAsyncError(async (req, res) => {
  const now    = new Date();
  const filter = {
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
  const announcements = await Announcement.find(filter)
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  res.status(200).json({ success: true, announcements });
});

// POST /api/v1/announcements — Admin only
export const createAnnouncement = catchAsyncError(async (req, res, next) => {
  if (req.user.constructor.modelName !== "Admin") {
    return next(new ErrorHandler("Only admins can post announcements.", 403));
  }
  const { text, type, expiresAt } = req.body;
  if (!text?.trim()) return next(new ErrorHandler("Text is required.", 400));

  const ann = await Announcement.create({
    text:     text.trim(),
    type:     type || "info",
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    postedBy: { id: req.user._id, name: req.user.name },
  });
  res.status(201).json({ success: true, announcement: ann });
});

// DELETE /api/v1/announcements/:id — Admin only (soft delete)
export const deleteAnnouncement = catchAsyncError(async (req, res, next) => {
  if (req.user.constructor.modelName !== "Admin") {
    return next(new ErrorHandler("Only admins can delete announcements.", 403));
  }
  const ann = await Announcement.findById(req.params.id);
  if (!ann) return next(new ErrorHandler("Announcement not found.", 404));
  ann.isActive = false;
  await ann.save();
  res.status(200).json({ success: true, message: "Announcement removed." });
});
