import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    // The mentorship session this chat belongs to
    mentorshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MentorshipRequest",
      required: false,
    },

    // The connection this chat belongs to (for generic connections)
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Connection",
      required: false,
    },

    // Sender info (embedded for fast read — no join needed)
    sender: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ["Student", "Alumni", "Teacher", "System"], required: true },
    },

    // Message content
    text: {
      type: String,
      required: true,
      maxLength: [2000, "Message cannot exceed 2000 characters."],
      trim: true,
    },

    // Optional: meeting link shared in chat
    meetingLink: { type: String, default: null },

    // System messages (slot refresh, session expiry notices)
    isSystem: { type: Boolean, default: false },

    // Profanity flagging — flagged messages are saved but hidden/reported to admin
    is_flagged: { type: Boolean, default: false },

    // Read receipt — receiver has seen it
    readBy: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

// Compound index for fast chat history fetch
chatMessageSchema.index({ mentorshipId: 1, createdAt: 1 });
chatMessageSchema.index({ connectionId: 1, createdAt: 1 });
// Fix 8: Index for unread count aggregation
chatMessageSchema.index({ "sender.id": 1, readBy: 1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);