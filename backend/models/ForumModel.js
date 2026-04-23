import mongoose from "mongoose";

// ── Answer sub-document ───────────────────────────────────────────────────────
const answerSchema = new mongoose.Schema(
  {
    author: {
      id:   { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ["Student", "Alumni", "Teacher", "Admin"], required: true },
    },
    body: {
      type: String,
      required: [true, "Answer body is required."],
      maxLength: [5000, "Answer cannot exceed 5000 characters."],
      trim: true,
    },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId }], // array of user _ids
  },
  { timestamps: true }
);

// ── Question (main document) ──────────────────────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    author: {
      id:   { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ["Student", "Alumni", "Teacher", "Admin"], required: true },
    },
    title: {
      type: String,
      required: [true, "Title is required."],
      maxLength: [200, "Title cannot exceed 200 characters."],
      trim: true,
    },
    body: {
      type: String,
      maxLength: [5000, "Body cannot exceed 5000 characters."],
      trim: true,
    },
    tags: [
      {
        type: String,
        enum: ["career", "technical", "campus", "internship", "higher-studies", "general", "placement", "skills"],
      },
    ],
    answers: [answerSchema],
    views:   { type: Number, default: 0 },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId }], // Track unique viewers
    // Closed questions cannot receive new answers
    isClosed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Full-text search index on title + body
questionSchema.index({ title: "text", body: "text" });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdAt: -1 });

export const Question = mongoose.model("Question", questionSchema);
