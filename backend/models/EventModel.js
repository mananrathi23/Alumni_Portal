import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required."],
      maxLength: [150, "Title cannot exceed 150 characters."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      maxLength: [3000, "Description cannot exceed 3000 characters."],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Event date is required."],
    },
    time: {
      type: String,        // e.g. "3:00 PM"
      required: [true, "Event time is required."],
    },
    // Physical location OR online link — at least one required
    location: { type: String, trim: true },
    link:     { type: String, trim: true },

    type: {
      type: String,
      enum: ["seminar", "workshop", "webinar", "hackathon", "reunion", "placement", "other"],
      default: "other",
    },

    organizer: {
      id:   { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ["Admin", "Alumni", "Teacher"], required: true },
    },

    // Students who RSVP'd
    registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],

    // Last date to register for this event (optional)
    registrationDeadline: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Sort by upcoming date by default
eventSchema.index({ date: 1 });
eventSchema.index({ "organizer.id": 1 });

export const Event = mongoose.model("Event", eventSchema);
