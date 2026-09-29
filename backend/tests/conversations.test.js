/**
 * conversations.test.js — one chat per pair of users.
 * Connection chat, mentorship sessions and meeting-link messages between the
 * same two people share a single conversation.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { jest } from '@jest/globals';

const emitToUser = jest.fn();
jest.unstable_mockModule('../Socket.js', () => ({ emitToUser, emitToAll: jest.fn(), emitFeedUpdated: jest.fn() }));

const { default: userRouter } = await import('../routes/userRouter.js');
const { default: conversationRouter } = await import('../routes/ConversationRouter.js');
const { default: mentorshipRouter } = await import('../routes/MentorshipRouter.js');
const { default: adminRouter } = await import('../routes/AdminUserRouter.js');
const { errorMiddleware } = await import('../middlewares/error.js');
const { Connection } = await import('../models/ConnectionModel.js');
const { MentorshipRequest } = await import('../models/MentorshipRequestModel.js');
const { ChatMessage } = await import('../models/ChatMessageModel.js');
const { Conversation } = await import('../models/ConversationModel.js');
const { conversationKey, backfillConversationKeys } = await import('../utils/conversations.js');

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
testApp.use('/api/v1/conversations', conversationRouter);
testApp.use('/api/v1/mentorship', mentorshipRouter);
testApp.use('/api/v1/admin/users', adminRouter);
testApp.use(errorMiddleware);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'test' });
  process.env.JWT_SECRET_KEY = 'test_secret';
  process.env.JWT_EXPIRE = '7d';
  process.env.COOKIE_EXPIRE = '7';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  emitToUser.mockClear();
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});

let phoneSeq = 0;
async function loginAs(email, Model, extra = {}) {
  const { [Model]: m } = await import(`../models/${Model}Model.js`);
  const user = await m.create({
    name: `${Model} ${email.split('@')[0]}`, email, phone: `+9197${String(10000000 + phoneSeq++)}`,
    password: 'Password@123', accountVerified: true, adminVerified: true, ...extra,
  });
  const res = await request(testApp).post('/api/v1/user/login').send({ email, password: 'Password@123', role: Model });
  return { token: res.body.token, user, id: user._id.toString() };
}
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const connect = (a, b) => Connection.create({
  sender: { id: a.user._id, name: a.user.name, role: a.user.constructor.modelName },
  receiver: { id: b.user._id, name: b.user.name, role: b.user.constructor.modelName },
  status: 'Accepted',
});
const mentorship = (student, mentor, status = 'Accepted') => MentorshipRequest.create({
  student: { id: student.user._id, name: student.user.name },
  mentor: { id: mentor.user._id, name: mentor.user.name, role: mentor.user.constructor.modelName },
  goal: 'career', slot: { day: 'Mon', time: '10:00' }, status,
});

describe('Conversation list', () => {
  it('merges a connection and mentorship sessions with the same person into one entry', async () => {
    const student = await loginAs('s@test.com', 'Student');
    const mentor = await loginAs('m@test.com', 'Alumni');
    await connect(student, mentor);
    await mentorship(student, mentor, 'Accepted');
    await mentorship(student, mentor, 'Completed');

    const res = await request(testApp).get('/api/v1/conversations').set(auth(student.token));
    expect(res.status).toBe(200);
    expect(res.body.conversations).toHaveLength(1);
    const [c] = res.body.conversations;
    expect(c.userId).toBe(mentor.id);
    expect(c.user.name).toBe(mentor.user.name);
    expect(c.connectionId).toBeTruthy();
    expect(c.mentorships.map((m) => m.status).sort()).toEqual(['Accepted', 'Completed']);
    expect(c.canSend).toBe(true);
    expect(c.user).not.toHaveProperty('isBlocked');
  });

  it('lists separate people separately and sorts by latest message', async () => {
    const me = await loginAs('me@test.com', 'Student');
    const a = await loginAs('a@test.com', 'Student');
    const b = await loginAs('b@test.com', 'Teacher');
    await connect(me, a);
    await mentorship(me, b);

    await request(testApp).post(`/api/v1/conversations/${me.id}/messages`).set(auth(b.token)).send({ text: 'from b' });
    await request(testApp).post(`/api/v1/conversations/${me.id}/messages`).set(auth(a.token)).send({ text: 'from a' });

    const res = await request(testApp).get('/api/v1/conversations').set(auth(me.token));
    expect(res.body.conversations.map((c) => c.userId)).toEqual([a.id, b.id]);
    expect(res.body.conversations[0].lastMessage.text).toBe('from a');
    expect(res.body.conversations[0].unread).toBe(1);
  });
});

describe('Messages', () => {
  it('connection messages and mentorship meeting links land in the same thread', async () => {
    const student = await loginAs('s@test.com', 'Student');
    const mentor = await loginAs('m@test.com', 'Alumni');
    await connect(student, mentor);
    const session = await mentorship(student, mentor, 'Accepted');

    await request(testApp).post(`/api/v1/conversations/${mentor.id}/messages`).set(auth(student.token)).send({ text: 'hi' });
    const link = await request(testApp).put(`/api/v1/mentorship/requests/${session._id}/meeting-link`)
      .set(auth(mentor.token)).send({ link: 'https://meet.example/abc' });
    expect(link.status).toBe(200);

    const res = await request(testApp).get(`/api/v1/conversations/${mentor.id}/messages`).set(auth(student.token));
    expect(res.body.messages.map((m) => m.text)).toEqual(['hi', '📎 Meeting Link: https://meet.example/abc']);
    expect(res.body.messages[1].mentorshipId).toBe(session._id.toString());
    expect(res.body.messages[1].meetingLink).toBe('https://meet.example/abc');

    // Pushed live to both people
    const pushedTo = emitToUser.mock.calls.filter(([, ev]) => ev === 'chat:new_message').map(([id]) => id.toString());
    expect(pushedTo).toEqual(expect.arrayContaining([student.id, mentor.id]));
  });

  it('an active mentorship alone is enough to chat', async () => {
    const student = await loginAs('s@test.com', 'Student');
    const mentor = await loginAs('m@test.com', 'Teacher');
    await mentorship(student, mentor, 'Accepted');
    const res = await request(testApp).post(`/api/v1/conversations/${student.id}/messages`).set(auth(mentor.token)).send({ text: 'welcome' });
    expect(res.status).toBe(201);
    expect(res.body.message.conversationKey).toBe(conversationKey(student.id, mentor.id));
  });

  it('only a finished mentorship keeps the history readable but closed', async () => {
    const student = await loginAs('s@test.com', 'Student');
    const mentor = await loginAs('m@test.com', 'Alumni');
    await mentorship(student, mentor, 'Completed');

    const read = await request(testApp).get(`/api/v1/conversations/${mentor.id}/messages`).set(auth(student.token));
    expect(read.status).toBe(200);

    const send = await request(testApp).post(`/api/v1/conversations/${mentor.id}/messages`).set(auth(student.token)).send({ text: 'hello?' });
    expect(send.status).toBe(403);
    expect(send.body.message).toMatch(/session has ended/i);

    const list = await request(testApp).get('/api/v1/conversations').set(auth(student.token));
    expect(list.body.conversations[0]).toMatchObject({ canSend: false });
    expect(list.body.conversations[0].readOnlyReason).toMatch(/connection request/i);
  });

  it('rejects strangers, yourself and bad ids', async () => {
    const a = await loginAs('a@test.com', 'Student');
    const b = await loginAs('b@test.com', 'Student');
    expect((await request(testApp).get(`/api/v1/conversations/${b.id}/messages`).set(auth(a.token))).status).toBe(403);
    expect((await request(testApp).post(`/api/v1/conversations/${b.id}/messages`).set(auth(a.token)).send({ text: 'x' })).status).toBe(403);
    expect((await request(testApp).get(`/api/v1/conversations/${a.id}/messages`).set(auth(a.token))).status).toBe(400);
    expect((await request(testApp).get('/api/v1/conversations/nope/messages').set(auth(a.token))).status).toBe(400);
  });
});

describe('Unread counts', () => {
  it('counts per person and clears when the chat is opened', async () => {
    const a = await loginAs('a@test.com', 'Student');
    const b = await loginAs('b@test.com', 'Student');
    await connect(a, b);
    for (const text of ['one', 'two']) {
      await request(testApp).post(`/api/v1/conversations/${a.id}/messages`).set(auth(b.token)).send({ text });
    }

    let res = await request(testApp).get('/api/v1/conversations/unread').set(auth(a.token));
    expect(res.body).toMatchObject({ total: 2, byUser: { [b.id]: 2 } });

    await request(testApp).get(`/api/v1/conversations/${b.id}/messages`).set(auth(a.token));
    res = await request(testApp).get('/api/v1/conversations/unread').set(auth(a.token));
    expect(res.body.total).toBe(0);

    // The sender's own messages never count as unread for them
    res = await request(testApp).get('/api/v1/conversations/unread').set(auth(b.token));
    expect(res.body.total).toBe(0);
  });
});

describe('Moderation', () => {
  it('rejects profanity and blocks the conversation after 3 strikes; admin unblock restores it', async () => {
    const a = await loginAs('a@test.com', 'Student');
    const b = await loginAs('b@test.com', 'Student');
    const conn = await connect(a, b);
    const send = (text) => request(testApp).post(`/api/v1/conversations/${b.id}/messages`).set(auth(a.token)).send({ text });

    expect((await send('you are shit')).status).toBe(400);
    expect((await send('you are shit')).status).toBe(400);
    expect((await send('you are shit')).status).toBe(403);
    const blocked = await send('sorry');
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toMatch(/blocked/i);

    const admin = await loginAs('admin@test.com', 'Admin');
    await request(testApp).put(`/api/v1/admin/users/connection/${conn._id}/unblock`).set(auth(admin.token));
    expect((await send('sorry')).status).toBe(201);
  });
});

describe('Backfill of messages from before the merge', () => {
  it('moves old connection and mentorship messages into one conversation, idempotently', async () => {
    const student = await loginAs('s@test.com', 'Student');
    const mentor = await loginAs('m@test.com', 'Alumni');
    const conn = await connect(student, mentor);
    const session = await mentorship(student, mentor, 'Accepted');
    await MentorshipRequest.updateOne({ _id: session._id }, { isBlocked: true, violationCount: 3 });

    const t = Date.now();
    await ChatMessage.insertMany([
      { connectionId: conn._id, sender: { id: student.user._id, name: 'S', role: 'Student' }, text: 'old connection msg', createdAt: new Date(t - 3000) },
      { mentorshipId: session._id, sender: { id: mentor.user._id, name: 'M', role: 'Alumni' }, text: 'old mentorship msg', createdAt: new Date(t - 2000) },
      { connectionId: new mongoose.Types.ObjectId(), sender: { id: student.user._id, name: 'S', role: 'Student' }, text: 'orphan', createdAt: new Date(t - 1000) },
    ]);

    expect(await backfillConversationKeys()).toBe(2);
    expect(await backfillConversationKeys()).toBe(0); // nothing left to do

    const key = conversationKey(student.id, mentor.id);
    const msgs = await ChatMessage.find({ conversationKey: key }).sort({ createdAt: 1 }).lean();
    expect(msgs.map((m) => m.text)).toEqual(['old connection msg', 'old mentorship msg']);
    expect(msgs[0].recipientId.toString()).toBe(mentor.id);
    expect(msgs[1].recipientId.toString()).toBe(student.id);

    const conv = await Conversation.findOne({ key }).lean();
    expect(conv.lastMessage.text).toBe('old mentorship msg');
    expect(conv.isBlocked).toBe(true); // the blocked mentorship chat stays blocked

    const res = await request(testApp).get(`/api/v1/conversations/${mentor.id}/messages`).set(auth(student.token));
    expect(res.body.messages.map((m) => m.text)).toEqual(['old connection msg', 'old mentorship msg']);
  });
});
