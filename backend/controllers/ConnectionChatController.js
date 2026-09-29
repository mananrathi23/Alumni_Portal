import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Connection } from "../models/ConnectionModel.js";
import { ConnectionChatMessage } from "../models/ConnectionChatModel.js";
import { emitToUser } from "../Socket.js";

// ── GET chat history for a connection ────────────────────────────────────────
// GET /api/v1/connections/:connectionId/chat
export const getConnectionChat = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const { connectionId } = req.params;

  const connection = await Connection.findById(connectionId);
  if (!connection || connection.status !== "Accepted") {
    return next(new ErrorHandler("Connection not found or not accepted.", 404));
  }

  const isMember =
    connection.sender.id.equals(user._id) ||
    connection.receiver.id.equals(user._id);
  if (!isMember) {
    return next(new ErrorHandler("You are not part of this connection.", 403));
  }

  const messages = await ConnectionChatMessage.find({ connectionId })
    .sort({ createdAt: 1 })
    .lean();

  // Mark as read
  await ConnectionChatMessage.updateMany(
    {
      connectionId,
      "sender.id": { $ne: user._id },
      readBy: { $ne: user._id },
    },
    { $addToSet: { readBy: user._id } }
  );

  res.status(200).json({ success: true, messages });
});

// ── Send a message ────────────────────────────────────────────────────────────
// POST /api/v1/connections/:connectionId/chat
export const sendConnectionMessage = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const role = user.constructor.modelName;
  const { connectionId } = req.params;
  const { text } = req.body;

  if (!text?.trim()) {
    return next(new ErrorHandler("Message text is required.", 400));
  }

  const connection = await Connection.findById(connectionId);
  if (!connection || connection.status !== "Accepted") {
    return next(new ErrorHandler("Connection not found or not accepted.", 404));
  }

  const isSender   = connection.sender.id.equals(user._id);
  const isReceiver = connection.receiver.id.equals(user._id);
  if (!isSender && !isReceiver) {
    return next(new ErrorHandler("You are not part of this connection.", 403));
  }

  const message = await ConnectionChatMessage.create({
    connectionId,
    sender: { id: user._id, name: user.name, role },
    text: text.trim(),
  });

  const recipientId = isSender ? connection.receiver.id : connection.sender.id;
  emitToUser(recipientId, "connection:chat_message", { connectionId, message });

  res.status(201).json({ success: true, message });
});

// ── Get unread counts per connection ──────────────────────────────────────────
// GET /api/v1/connections/chat/unread-counts
export const getConnectionUnreadCounts = catchAsyncError(async (req, res) => {
  const user = req.user;

  const connections = await Connection.find({
    status: "Accepted",
    $or: [{ "sender.id": user._id }, { "receiver.id": user._id }],
  }).select("_id").lean();

  const connectionIds = connections.map((c) => c._id);

  const counts = await ConnectionChatMessage.aggregate([
    {
      $match: {
        connectionId: { $in: connectionIds },
        "sender.id": { $ne: user._id },
        readBy: { $ne: user._id },
      },
    },
    { $group: { _id: "$connectionId", count: { $sum: 1 } } },
  ]);

  const unread = {};
  counts.forEach((c) => { unread[c._id.toString()] = c.count; });

  res.status(200).json({ success: true, unread });
});