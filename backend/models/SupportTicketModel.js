import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["User", "AI", "Admin"],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "userModel",
    },
    userModel: {
      type: String,
      required: true,
      enum: ["Student", "Alumni", "Teacher"],
    },
    status: {
      type: String,
      enum: ["AI_Handling", "Escalation_Offered", "Escalated", "Resolved"],
      default: "AI_Handling",
    },
    messages: [messageSchema],
    escalationOffered: {
      type: Boolean,
      default: false,
    },
    userChoice: {
      type: String,
      enum: ["continue_with_ai", "escalate_to_admin"],
      default: null,
    },
  },
  { timestamps: true }
);

export const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);