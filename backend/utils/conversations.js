/**
 * utils/conversations.js
 * One chat per pair of users. Messages from connection chats and from every
 * mentorship session between the same two people live in a single conversation,
 * identified by conversationKey(a, b).
 */
import mongoose from "mongoose";
import { ChatMessage } from "../models/ChatMessageModel.js";
import { Conversation } from "../models/ConversationModel.js";
import { Connection } from "../models/ConnectionModel.js";
import { MentorshipRequest } from "../models/MentorshipRequestModel.js";
import { emitToUser } from "../Socket.js";

// Order-independent: conversationKey(a, b) === conversationKey(b, a)
export const conversationKey = (a, b) => [a.toString(), b.toString()].sort().join("_");

const MENTORSHIP_CHAT_STATUSES = ["Accepted", "Completed"];

// Everyone `userId` can have a conversation with: accepted connections plus
// accepted/completed mentorships, grouped by the other person.
// Returns Map<otherUserId, { userId, role, connectionId, connectedAt, mentorships[] }>
export const findPartners = async (userId) => {
  const [connections, mentorships] = await Promise.all([
    Connection.find({
      status: "Accepted",
      $or: [{ "sender.id": userId }, { "receiver.id": userId }],
    }).select("sender receiver updatedAt").lean(),
    MentorshipRequest.find({
      status: { $in: MENTORSHIP_CHAT_STATUSES },
      $or: [{ "student.id": userId }, { "mentor.id": userId }],
    }).select("student mentor goal slot status meetingLink createdAt").sort({ createdAt: -1 }).lean(),
  ]);

  const partners = new Map();
  const partner = (id, role) => {
    const key = id.toString();
    if (!partners.has(key)) {
      partners.set(key, { userId: key, role, connectionId: null, connectedAt: null, mentorships: [] });
    }
    return partners.get(key);
  };

  for (const c of connections) {
    const other = c.sender.id.equals(userId) ? c.receiver : c.sender;
    const p = partner(other.id, other.role);
    p.connectionId = c._id;
    p.connectedAt = c.updatedAt;
  }
  for (const m of mentorships) {
    const iAmStudent = m.student.id.equals(userId);
    const p = iAmStudent ? partner(m.mentor.id, m.mentor.role) : partner(m.student.id, "Student");
    p.mentorships.push({
      _id: m._id,
      goal: m.goal,
      slot: m.slot,
      status: m.status,
      meetingLink: m.meetingLink,
      iAmMentor: !iAmStudent,
      createdAt: m.createdAt,
    });
  }
  return partners;
};

// The relationship between two specific users (same shape as one findPartners entry)
export const findRelationship = async (userId, otherId) => {
  const [connection, mentorships] = await Promise.all([
    Connection.findOne({
      status: "Accepted",
      $or: [
        { "sender.id": userId, "receiver.id": otherId },
        { "sender.id": otherId, "receiver.id": userId },
      ],
    }).select("_id").lean(),
    MentorshipRequest.find({
      status: { $in: MENTORSHIP_CHAT_STATUSES },
      $or: [
        { "student.id": userId, "mentor.id": otherId },
        { "student.id": otherId, "mentor.id": userId },
      ],
    }).select("status").lean(),
  ]);
  return { connectionId: connection?._id ?? null, mentorships };
};

// Connected users can always chat; otherwise an active (accepted) mentorship is
// needed. With only finished sessions the history stays readable but closed.
export const sendPermission = ({ connectionId, mentorships }) => {
  if (connectionId) return { canSend: true, readOnlyReason: null };
  if (mentorships.some((m) => m.status === "Accepted")) return { canSend: true, readOnlyReason: null };
  if (mentorships.length > 0) {
    return {
      canSend: false,
      readOnlyReason: "Your mentorship session has ended. Send a connection request to keep chatting.",
    };
  }
  return { canSend: false, readOnlyReason: "You can only message your connections and mentorship partners." };
};

const recordLastMessage = async (key, participants, lastMessage) => {
  const update = {
    $set: { lastMessage },
    $setOnInsert: { participants },
  };
  try {
    await Conversation.updateOne({ key }, update, { upsert: true });
  } catch (err) {
    // Two first messages at once can race on the unique key; the other insert won
    if (err.code !== 11000) throw err;
    await Conversation.updateOne({ key }, { $set: { lastMessage } });
  }
};

/**
 * Save a message into the pair's conversation and push it to both users.
 * sender: { id, name, role }; optional mentorshipId / meetingLink / isSystem.
 */
export const postChatMessage = async ({ sender, recipientId, text, mentorshipId, meetingLink, isSystem }) => {
  const key = conversationKey(sender.id, recipientId);
  const message = await ChatMessage.create({
    conversationKey: key,
    recipientId,
    sender,
    text,
    ...(mentorshipId && { mentorshipId }),
    ...(meetingLink && { meetingLink }),
    ...(isSystem && { isSystem: true }),
  });

  await recordLastMessage(key, [sender.id, recipientId], {
    text: message.text,
    senderId: sender.id,
    createdAt: message.createdAt,
  });

  const payload = { conversationKey: key, fromUserId: sender.id.toString(), message };
  emitToUser(recipientId, "chat:new_message", payload);
  emitToUser(sender.id, "chat:new_message", payload); // the sender's other tabs/devices
  return message;
};

/**
 * One-time migration: messages written before conversations were merged only
 * carry a connectionId or mentorshipId. Give each its conversationKey and
 * recipientId, and create the Conversation (last message, block state).
 * Idempotent — safe to run on every startup and on every instance.
 */
export const backfillConversationKeys = async () => {
  const pending = await ChatMessage.find({ conversationKey: { $exists: false } })
    .select("connectionId mentorshipId sender.id")
    .lean();
  if (pending.length === 0) return 0;

  const idsOf = (field) => [...new Set(pending.filter((m) => m[field]).map((m) => m[field].toString()))];
  const [connections, mentorships] = await Promise.all([
    Connection.find({ _id: { $in: idsOf("connectionId") } }).select("sender.id receiver.id isBlocked").lean(),
    MentorshipRequest.find({ _id: { $in: idsOf("mentorshipId") } })
      .select("student.id mentor.id isBlocked violationCount").lean(),
  ]);

  // parent (connection or mentorship) id → the two participants + moderation state
  const parents = new Map();
  for (const c of connections) {
    parents.set(c._id.toString(), { pair: [c.sender.id, c.receiver.id], isBlocked: !!c.isBlocked, violations: 0 });
  }
  for (const m of mentorships) {
    parents.set(m._id.toString(), {
      pair: [m.student.id, m.mentor.id],
      isBlocked: !!m.isBlocked,
      violations: m.violationCount || 0,
    });
  }

  const ops = [];
  const conversations = new Map(); // key → { participants, isBlocked, violationCount }
  for (const m of pending) {
    const parent = parents.get((m.connectionId || m.mentorshipId)?.toString());
    if (!parent) continue; // its connection/mentorship was deleted; nobody can reach it
    const [a, b] = parent.pair;
    const key = conversationKey(a, b);
    const recipientId = a.equals(m.sender.id) ? b : a;
    ops.push({ updateOne: { filter: { _id: m._id }, update: { $set: { conversationKey: key, recipientId } } } });

    const conv = conversations.get(key) || { participants: [a, b], isBlocked: false, violationCount: 0 };
    conv.isBlocked ||= parent.isBlocked;
    conv.violationCount = Math.max(conv.violationCount, parent.violations);
    conversations.set(key, conv);
  }

  for (let i = 0; i < ops.length; i += 500) {
    await ChatMessage.bulkWrite(ops.slice(i, i + 500), { ordered: false });
  }

  // Latest message per touched conversation, for the list preview
  const latest = await ChatMessage.aggregate([
    { $match: { conversationKey: { $in: [...conversations.keys()] } } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $group: { _id: "$conversationKey", text: { $first: "$text" }, senderId: { $first: "$sender.id" }, createdAt: { $first: "$createdAt" } } },
  ]);
  const latestByKey = new Map(latest.map((l) => [l._id, l]));

  for (const [key, conv] of conversations) {
    const last = latestByKey.get(key);
    const update = {
      $max: { violationCount: conv.violationCount },
      $setOnInsert: { participants: conv.participants, isBlocked: conv.isBlocked },
    };
    if (last) update.$set = { lastMessage: { text: last.text, senderId: last.senderId, createdAt: last.createdAt } };
    await Conversation.updateOne({ key }, update, { upsert: true });
  }

  return ops.length;
};

export const isValidUserId = (id) => mongoose.isValidObjectId(id);
