import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  authorId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, enum: ["Student", "Alumni", "Teacher", "Admin"], required: true },
  text:       { type: String, required: true, maxLength: 1000 },
  createdAt:  { type: Date, default: Date.now },
});

const incubationSchema = new mongoose.Schema({
  // ── Core idea info ──────────────────────────────────────────────────────────
  title: {
    type: String, required: [true, "Title is required."],
    trim: true, maxLength: [150, "Title cannot exceed 150 characters."],
  },
  description: {
    type: String, required: [true, "Description is required."],
    maxLength: [3000, "Description cannot exceed 3000 characters."],
  },
  problemStatement: { type: String, maxLength: 1000 },
  targetAudience:   { type: String, maxLength: 500 },
  stage: {
    type: String,
    enum: ["idea", "prototype", "mvp", "scaling"],
    default: "idea",
  },
  tags: [{ type: String, trim: true }], // e.g. ["AI", "EdTech", "HealthTech"]

  // ── What they need ──────────────────────────────────────────────────────────
  lookingFor: [{
    type: String,
    enum: ["investment", "co-founder", "mentor", "feedback", "developer", "designer", "other"],
  }],

  // Links shown only when stage is prototype or mvp
  projectLink: { type: String, trim: true, default: "" }, // deployed / live link
  repoLink:    { type: String, trim: true, default: "" }, // GitHub / GitLab repo

  // ── Author ──────────────────────────────────────────────────────────────────
  authorId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, enum: ["Student", "Alumni", "Teacher"], required: true },
  authorDept: { type: String },

  // ── Engagement ──────────────────────────────────────────────────────────────
  comments:   [commentSchema],
  interestedUsers: [{  // people who clicked "I'm Interested"
    userId:   mongoose.Schema.Types.ObjectId,
    name:     String,
    role:     String,
    type:     { type: String, enum: ["investor", "collaborator", "mentor", "other"], default: "other" },
    message:  String,
    joinedAt: { type: Date, default: Date.now },
  }],
  upvotes: [{ type: mongoose.Schema.Types.ObjectId }], // user ids who upvoted

  // ── Meta ─────────────────────────────────────────────────────────────────────
  active:    { type: Boolean, default: true },
  createdAt: { type: Date,    default: Date.now },
  updatedAt: { type: Date,    default: Date.now },
});

incubationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const Incubation = mongoose.model("Incubation", incubationSchema);
