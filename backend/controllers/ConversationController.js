import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { ChatMessage } from "../models/ChatMessageModel.js";
import { Conversation } from "../models/ConversationModel.js";
import { emitToUser } from "../Socket.js";
import { fetchChatPage } from "../utils/chatHistory.js";
import { containsProfanity } from "../utils/ProfanityFilter.js";
import {
  conversationKey, findPartners, findRelationship, sendPermission, postChatMessage, isValidUserId,
} from "../utils/conversations.js";
import { MEMBER_MODELS } from "../utils/userModels.js";

const PROFILE_FIELDS = "name department profilePhoto linkedIn github portfolio currentCompany currentDesignation designation isBlocked";
const MAX_VIOLATIONS = 3;

// Profiles for a set of partners, looked up per role collection in parallel
const loadProfiles = async (partners) => {
  const idsByRole = {};
  for (const p of partners) (idsByRole[p.role] ||= []).push(p.userId);
  const results = await Promise.all(
    Object.entries(idsByRole)
      .filter(([role]) => MEMBER_MODELS[role])
      .map(([role, ids]) => MEMBER_MODELS[role].find({ _id: { $in: ids } }).select(PROFILE_FIELDS).lean()
        .then((docs) => docs.map((d) => ({ ...d, role }))))
  );
  return new Map(results.flat().map((d) => [d._id.toString(), d]));
};

// Unread messages per conversation key, limited to the given keys
const unreadByKey = async (userId, keys) => {
  const counts = await ChatMessage.aggregate([
    { $match: { recipientId: userId, readBy: { $ne: userId }, conversationKey: { $in: keys } } },
    { $group: { _id: "$conversationKey", count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [c._id, c.count]));
};

// ── GET /api/v1/conversations ────────────────────────────────────────────────
// One entry per person: connection and all mentorship sessions merged.
export const listConversations = catchAsyncError(async (req, res) => {
  const me = req.user._id;
  const partners = [...(await findPartners(me)).values()];
  const keys = partners.map((p) => conversationKey(me, p.userId));

  const [profiles, conversations, unread] = await Promise.all([
    loadProfiles(partners),
    Conversation.find({ key: { $in: keys } }).select("key lastMessage isBlocked").lean(),
    unreadByKey(me, keys),
  ]);
  const convByKey = new Map(conversations.map((c) => [c.key, c]));

  const list = [];
  for (const p of partners) {
    const profile = profiles.get(p.userId);
    if (!profile || profile.isBlocked) continue; // hide users an admin has blocked
    const { isBlocked: _hidden, ...user } = profile;
    const key = conversationKey(me, p.userId);
    const conv = convByKey.get(key);
    list.push({
      key,
      userId: p.userId,
      user,
      connectionId: p.connectionId,
      connectedAt: p.connectedAt,
      mentorships: p.mentorships,
      ...sendPermission(p),
      isBlocked: !!conv?.isBlocked,
      lastMessage: conv?.lastMessage ?? null,
      unread: unread.get(key) || 0,
    });
  }

  // Most recent activity first: last message, else when the relationship started
  const activity = (c) => new Date(c.lastMessage?.createdAt || c.mentorships[0]?.createdAt || c.connectedAt || 0);
  list.sort((a, b) => activity(b) - activity(a));

  res.status(200).json({ success: true, conversations: list });
});

// ── GET /api/v1/conversations/unread ─────────────────────────────────────────
// Badge counts: { total, byUser: { otherUserId: n } }
export const getUnreadSummary = catchAsyncError(async (req, res) => {
  const me = req.user._id;
  const partnerIds = [...(await findPartners(me)).keys()];
  const counts = await unreadByKey(me, partnerIds.map((id) => conversationKey(me, id)));

  const byUser = {};
  let total = 0;
  for (const id of partnerIds) {
    const n = counts.get(conversationKey(me, id)) || 0;
    if (n) byUser[id] = n;
    total += n;
  }
  res.status(200).json({ success: true, total, byUser });
});

// Resolves :userId and checks the two users may see a conversation at all
const loadRelationship = async (req, next) => {
  const otherId = req.params.userId;
  if (!isValidUserId(otherId)) {
    next(new ErrorHandler("Invalid user id.", 400));
    return null;
  }
  if (otherId === req.user._id.toString()) {
    next(new ErrorHandler("You cannot message yourself.", 400));
    return null;
  }
  const relationship = await findRelationship(req.user._id, otherId);
  if (!relationship.connectionId && relationship.mentorships.length === 0) {
    next(new ErrorHandler("You can only message your connections and mentorship partners.", 403));
    return null;
  }
  return { otherId, key: conversationKey(req.user._id, otherId), relationship };
};

// Marks the user's unread messages in a conversation as read, and tells their
// open tabs to refresh the Messages badge when anything changed
const markRead = async (key, userId) => {
  const result = await ChatMessage.updateMany(
    { conversationKey: key, recipientId: userId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
  if (result.modifiedCount > 0) emitToUser(userId, "chat:read", { conversationKey: key });
};

// ── GET /api/v1/conversations/:userId/messages?before=&limit= ────────────────
export const getMessages = catchAsyncError(async (req, res, next) => {
  const ctx = await loadRelationship(req, next);
  if (!ctx) return;

  const { messages, hasMore } = await fetchChatPage({ conversationKey: ctx.key }, req.query);
  // Opening the chat (first page) marks everything as read; older pages don't need to
  if (!req.query.before) await markRead(ctx.key, req.user._id);

  res.status(200).json({ success: true, messages, hasMore });
});

// ── POST /api/v1/conversations/:userId/messages ──────────────────────────────
export const sendMessage = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const text = req.body.text?.trim();
  if (!text) return next(new ErrorHandler("Message text is required.", 400));

  const ctx = await loadRelationship(req, next);
  if (!ctx) return;

  const { canSend, readOnlyReason } = sendPermission(ctx.relationship);
  if (!canSend) return next(new ErrorHandler(readOnlyReason, 403));

  const conversation = await Conversation.findOne({ key: ctx.key }).select("isBlocked violationCount").lean();
  if (conversation?.isBlocked) {
    return next(new ErrorHandler(
      "This chat has been blocked due to a policy violation. Please contact an administrator to restore access.",
      403
    ));
  }

  if (await containsProfanity(text)) {
    const updated = await Conversation.findOneAndUpdate(
      { key: ctx.key },
      { $inc: { violationCount: 1 }, $setOnInsert: { participants: [user._id, ctx.otherId] } },
      { upsert: true, new: true }
    );
    if (updated.violationCount >= MAX_VIOLATIONS) {
      await Conversation.updateOne({ key: ctx.key }, { $set: { isBlocked: true } });
      emitToUser(ctx.otherId, "chat:blocked", { conversationKey: ctx.key, blockedBy: user.name });
      emitToUser(user._id, "chat:blocked", { conversationKey: ctx.key });
      return next(new ErrorHandler(
        "Your chat has been blocked due to repeated use of inappropriate language. Please contact an administrator.",
        403
      ));
    }
    return next(new ErrorHandler(
      "Your message contains inappropriate language and was not sent. Please keep the conversation professional.",
      400
    ));
  }

  const message = await postChatMessage({
    sender: { id: user._id, name: user.name, role: user.constructor.modelName },
    recipientId: ctx.otherId,
    text,
  });
  res.status(201).json({ success: true, message });
});

// ── PUT /api/v1/conversations/:userId/read ───────────────────────────────────
export const markConversationRead = catchAsyncError(async (req, res, next) => {
  const ctx = await loadRelationship(req, next);
  if (!ctx) return;
  await markRead(ctx.key, req.user._id);
  res.status(200).json({ success: true });
});
