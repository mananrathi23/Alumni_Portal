import mongoose from "mongoose";

const mentorshipRequestSchema = new mongoose.Schema({
  student: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    name: { type: String, required: true },
    department: String,
    year: String,
  },
  mentor: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["Alumni", "Teacher"], required: true },
  },
  goal: {
    type: String,
    enum: ["career", "resume", "interview", "technical", "general"],
    required: true,
  },
  note: { type: String, maxLength: 500 },
  slot: {
    day: { type: String, required: true },
    time: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected", "Cancelled", "Completed"],
    default: "Pending",
  },
  isBlocked: { type: Boolean, default: false },
  requestedAt: { type: Date, default: Date.now },
  // Exact datetime of the session (set when mentor accepts + slot day/time resolved)
  sessionDateTime: { type: Date, default: null },
  // Prevents sending duplicate reminder emails
  reminderSent: { type: Boolean, default: false },
  // Student's rating after session completion
  rating: {
    value:     { type: Number, min: 1, max: 5, default: null },
    feedback:  { type: String, maxLength: 500, default: "" },
    ratedAt:   { type: Date, default: null },
  },
  respondedAt: Date,
  completedAt: Date,
  meetingLink: { type: String, default: null },
}, {
  timestamps: true,
});

// Unique pending request to avoid duplicates
mentorshipRequestSchema.index(
  { "student.id": 1, "mentor.id": 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "Pending" } }
);

export const MentorshipRequest = mongoose.model("MentorshipRequest", mentorshipRequestSchema);
// Note: meetingLink field appended via patch
