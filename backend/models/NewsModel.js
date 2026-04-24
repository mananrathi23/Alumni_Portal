import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "News title is required."],
    trim: true,
    maxLength: [200, "Title cannot exceed 200 characters."],
  },
  description: {
    type: String,
    required: [true, "News description is required."],
    maxLength: [2000, "Description cannot exceed 2000 characters."],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const News = mongoose.model("News", newsSchema);
