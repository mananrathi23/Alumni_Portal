import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    // Every message between two people shares one key ("<idA>_<idB>", sorted),
    // whether it came from a connection chat or a mentorship session
    conversationKey: { type: String },
    recipientId: { type: mongoose.Schema.Types.ObjectId },

    // Optional context: the mentorship session a message is about (e.g. its meeting link)
    mentorshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MentorshipRequest",
      required: false,
    },

    // Legacy: the connection chat a message was sent in before conversations were merged
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

// Conversation history; _id breaks createdAt ties so "load earlier messages"
// pages never skip or repeat a message
chatMessageSchema.index({ conversationKey: 1, createdAt: 1, _id: 1 });
// Unread counts and mark-as-read
chatMessageSchema.index({ recipientId: 1, readBy: 1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);