import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    text: {
      type:     String,
      required: [true, "Announcement text is required."],
      maxLength: [300, "Announcement cannot exceed 300 characters."],
      trim:     true,
    },
    type: {
      type:    String,
      enum:    ["info", "warning", "success", "urgent"],
      default: "info",
    },
    isActive: { type: Boolean, default: true },
    postedBy: {
      id:   { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
    },
    expiresAt: { type: Date, default: null }, // null = never expires
  },
  { timestamps: true }
);

announcementSchema.index({ isActive: 1, createdAt: -1 });

export const Announcement = mongoose.model("Announcement", announcementSchema);
