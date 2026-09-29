import mongoose from "mongoose";

// One conversation per pair of users. Connection chat, every mentorship session
// and system messages (meeting links) between the same two people share it.
const conversationSchema = new mongoose.Schema(
  {
    // "<smallerId>_<largerId>" — see utils/conversations.js conversationKey()
    key: { type: String, required: true, unique: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, required: true }],

    // Preview for the conversation list
    lastMessage: {
      text: String,
      senderId: mongoose.Schema.Types.ObjectId,
      createdAt: Date,
    },

    // Profanity moderation: messages are rejected, and 3 strikes block the chat
    // until an admin unblocks it
    violationCount: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);
