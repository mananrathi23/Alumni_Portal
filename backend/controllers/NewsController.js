import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { News } from "../models/NewsModel.js";

// ── GET all active news (PUBLIC — no auth needed) ─────────────────────────────
export const getNews = catchAsyncError(async (req, res) => {
  const news = await News.find({ active: true })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("title description date createdAt");

  res.status(200).json({ success: true, count: news.length, news });
});

// ── POST create news (Admin only) ─────────────────────────────────────────────
export const createNews = catchAsyncError(async (req, res, next) => {
  const { title, description, date } = req.body;

  if (!title || !description) {
    return next(new ErrorHandler("Title and description are required.", 400));
  }

  const news = await News.create({
    title,
    description,
    date: date || Date.now(),
    postedBy: req.user._id,
  });

  res.status(201).json({ success: true, message: "News created successfully.", news });
});

// ── PUT update news (Admin only) ──────────────────────────────────────────────
export const updateNews = catchAsyncError(async (req, res, next) => {
  const news = await News.findById(req.params.id);
  if (!news) return next(new ErrorHandler("News not found.", 404));

  const { title, description, date, active } = req.body;
  if (title)       news.title       = title;
  if (description) news.description = description;
  if (date)        news.date        = date;
  if (active !== undefined) news.active = active;

  await news.save();
  res.status(200).json({ success: true, message: "News updated.", news });
});

// ── DELETE news (Admin only) ──────────────────────────────────────────────────
export const deleteNews = catchAsyncError(async (req, res, next) => {
  const news = await News.findById(req.params.id);
  if (!news) return next(new ErrorHandler("News not found.", 404));

  await news.deleteOne();
  res.status(200).json({ success: true, message: "News deleted." });
});
