import mongoose from "mongoose";

const connectionChatMessageSchema = new mongoose.Schema(
  {
    connectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Connection",
      required: true,
      index: true,
    },
    sender: {
      id:   { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ["Student", "Alumni", "Teacher"], required: true },
    },
    text: {
      type: String,
      required: true,
      maxLength: [2000, "Message cannot exceed 2000 characters."],
      trim: true,
    },
    readBy: [{ type: mongoose.Schema.Types.ObjectId }],
    // Profanity flagging — flagged messages are saved but reported to admin
    is_flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

connectionChatMessageSchema.index({ connectionId: 1, createdAt: 1 });

export const ConnectionChatMessage = mongoose.model("ConnectionChatMessage", connectionChatMessageSchema);