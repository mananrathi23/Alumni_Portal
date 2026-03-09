import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema({

  // Who sent the request
  sender: {
    id:   { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["Student", "Alumni", "Teacher"], required: true },
  },

  // Who received the request
  receiver: {
    id:   { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["Student", "Alumni", "Teacher"], required: true },
  },

  // Current state of the request
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected", "Withdrawn"],
    default: "Pending",
  },

  // Optional note when sending the request
  note: {
    type: String,
    maxLength: [300, "Note cannot exceed 300 characters."],
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Prevent duplicate requests between the same two users
connectionSchema.index(
  { "sender.id": 1, "receiver.id": 1 },
  { unique: true }
);

export const Connection = mongoose.model("Connection", connectionSchema);