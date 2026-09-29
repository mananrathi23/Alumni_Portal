import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "Company name is required."],
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Role/position is required."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required."],
      maxLength: [3000, "Description cannot exceed 3000 characters."],
      trim: true,
    },
    eligibility: {
      type: String,
      maxLength: [1000, "Eligibility cannot exceed 1000 characters."],
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract", "remote"],
      default: "full-time",
    },
    // e.g. ["React", "Node.js", "Python"]
    skills: [String],

    // Deadline for applications
    deadline: { type: Date },

    postedBy: {
      id:   { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ["Admin", "Alumni", "Teacher"], required: true },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text search on role, company, description, skills
jobSchema.index({ role: "text", company: "text", description: "text", skills: "text" });
jobSchema.index({ type: 1 });
jobSchema.index({ createdAt: -1 });

export const Job = mongoose.model("Job", jobSchema);
