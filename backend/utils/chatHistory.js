/**
 * utils/chatHistory.js
 * Paginated chat history shared by connection and mentorship chats.
 * Returns the newest `limit` messages (or those older than `before`),
 * oldest first, so the client can prepend pages as the user scrolls up.
 */
import mongoose from "mongoose";
import ErrorHandler from "../middlewares/error.js";
import { ChatMessage } from "../models/ChatMessageModel.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// scope: { connectionId } or { mentorshipId }
// query: req.query — optional `before` (message id) and `limit`
export const fetchChatPage = async (scope, query) => {
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const filter = { ...scope };

  if (query.before) {
    if (!mongoose.isValidObjectId(query.before)) {
      throw new ErrorHandler("Invalid message cursor.", 400);
    }
    const anchor = await ChatMessage.findOne({ _id: query.before, ...scope }).select("createdAt").lean();
    if (!anchor) throw new ErrorHandler("Message not found in this chat.", 404);
    filter.$or = [
      { createdAt: { $lt: anchor.createdAt } },
      { createdAt: anchor.createdAt, _id: { $lt: anchor._id } },
    ];
  }

  // Fetch one extra to know whether older messages remain
  const docs = await ChatMessage.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = docs.length > limit;
  return { messages: docs.slice(0, limit).reverse(), hasMore };
};
