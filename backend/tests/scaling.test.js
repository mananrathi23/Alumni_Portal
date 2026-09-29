/**
 * scaling.test.js — pagination, search escaping and count-only endpoints
 * added so list responses stay small as the user base grows.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../Socket.js', () => ({
  emitToUser: jest.fn(),
  emitToAll: jest.fn(),
  emitFeedUpdated: jest.fn(),
}));

const { default: userRouter } = await import('../routes/userRouter.js');
const { default: batchmatesRouter } = await import('../routes/BatchmatesRouter.js');
const { default: peopleRouter } = await import('../routes/PeopleRouter.js');
const { default: connectionRouter } = await import('../routes/ConnectionRouter.js');
const { default: mentorshipRouter } = await import('../routes/MentorshipRouter.js');
const { default: incubationRouter } = await import('../routes/IncubationRouter.js');
const { default: adminRouter } = await import('../routes/AdminUserRouter.js');
const { errorMiddleware } = await import('../middlewares/error.js');
const { Student } = await import('../models/StudentModel.js');
const { Alumni } = await import('../models/AlumniModel.js');
const { Connection } = await import('../models/ConnectionModel.js');
const { ChatMessage } = await import('../models/ChatMessageModel.js');
const { MentorshipRequest } = await import('../models/MentorshipRequestModel.js');
const { Incubation } = await import('../models/IncubationModel.js');

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
testApp.use('/api/v1/batchmates', batchmatesRouter);
testApp.use('/api/v1/people', peopleRouter);
testApp.use('/api/v1/connections', connectionRouter);
testApp.use('/api/v1/mentorship', mentorshipRouter);
testApp.use('/api/v1/incubation', incubationRouter);
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
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});

let phoneSeq = 0;
const nextPhone = () => `+9198${String(76543000 + phoneSeq++).padStart(8, '0')}`;

async function loginAs(email, Model, extraFields = {}) {
  const { [Model]: m } = await import(`../models/${Model}Model.js`);
  const user = await m.create({
    name: 'Test User', email, phone: nextPhone(), password: 'Password@123',
    accountVerified: true, adminVerified: true, ...extraFields,
  });
  const res = await request(testApp).post('/api/v1/user/login').send({ email, password: 'Password@123', role: Model });
  return { token: res.body.token, user };
}

// Bulk directory members (insertMany skips password hashing, which these tests don't need)
const makeMembers = (Model, count, fields) =>
  Model.insertMany(Array.from({ length: count }, (_, i) => ({
    name: `${fields.prefix ?? 'Member'} ${String(i).padStart(3, '0')}`,
    email: `${fields.prefix ?? 'member'}${i}-${Model.modelName}@test.com`.toLowerCase(),
    phone: nextPhone(),
    accountVerified: true, adminVerified: true, isBlocked: false,
    ...fields.extra,
  })));

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('Batchmates', () => {
  it('GET / returns per-year counts with a small preview, unset year last', async () => {
    const { token } = await loginAs('viewer@test.com', 'Student', { enrollmentYear: 2021 });
    await makeMembers(Student, 30, { prefix: 'Stu', extra: { enrollmentYear: 2022 } });
    await makeMembers(Alumni, 5, { prefix: 'Alu', extra: { enrollmentYear: 2022 } });
    await makeMembers(Alumni, 2, { prefix: 'Old', extra: { enrollmentYear: null } });

    const res = await request(testApp).get('/api/v1/batchmates').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBe(38);
    expect(res.body.batches.map((b) => b.year)).toEqual([2022, 2021, null]);

    const b2022 = res.body.batches[0];
    expect(b2022).toMatchObject({ count: 35, studentCount: 30, alumniCount: 5 });
    expect(b2022.preview).toHaveLength(4);
    expect(b2022.preview[0]).not.toHaveProperty('password');
    expect(b2022.members).toBeUndefined(); // full member lists are loaded per year
  });

  it('GET /:year pages through one batch without overlap', async () => {
    const { token } = await loginAs('viewer@test.com', 'Student');
    await makeMembers(Student, 30, { prefix: 'Stu', extra: { enrollmentYear: 2022 } });

    const p1 = await request(testApp).get('/api/v1/batchmates/2022?limit=24').set(auth(token));
    const p2 = await request(testApp).get('/api/v1/batchmates/2022?limit=24&page=2').set(auth(token));
    expect(p1.status).toBe(200);
    expect(p1.body).toMatchObject({ total: 30, hasMore: true });
    expect(p1.body.members).toHaveLength(24);
    expect(p2.body).toMatchObject({ total: 30, hasMore: false });
    expect(p2.body.members).toHaveLength(6);

    const ids = new Set([...p1.body.members, ...p2.body.members].map((m) => m._id));
    expect(ids.size).toBe(30);
  });

  it('GET /unset returns members without a year; a bad year is rejected', async () => {
    const { token } = await loginAs('viewer@test.com', 'Student', { enrollmentYear: 2020 });
    await makeMembers(Alumni, 3, { prefix: 'Old', extra: { enrollmentYear: null } });

    const unset = await request(testApp).get('/api/v1/batchmates/unset').set(auth(token));
    expect(unset.body.total).toBe(3);

    const bad = await request(testApp).get('/api/v1/batchmates/abc').set(auth(token));
    expect(bad.status).toBe(400);
  });
});

describe('Search escaping', () => {
  it.each(['C++', '(', '[a-', '.*'])('treats %s as plain text instead of crashing', async (term) => {
    const { token } = await loginAs('viewer@test.com', 'Student');
    await makeMembers(Student, 2, { prefix: 'C++ Dev', extra: { enrollmentYear: 2022 } });

    for (const url of ['/api/v1/people', '/api/v1/batchmates', '/api/v1/incubation', '/api/v1/mentorship/mentors']) {
      const res = await request(testApp).get(url).query({ search: term }).set(auth(token));
      expect(res.status).toBe(200);
    }
  });

  it('matches the literal text', async () => {
    const { token } = await loginAs('viewer@test.com', 'Student');
    await makeMembers(Student, 2, { prefix: 'C++ Dev', extra: { enrollmentYear: 2022 } });
    await makeMembers(Student, 2, { prefix: 'CXX Dev', extra: { enrollmentYear: 2022 } });

    const res = await request(testApp).get('/api/v1/people').query({ search: 'C++' }).set(auth(token));
    expect(res.body.people.map((p) => p.name).every((n) => n.startsWith('C++'))).toBe(true);
    expect(res.body.people).toHaveLength(2);
  });
});

describe('Chat history pagination', () => {
  async function seedChat(count, { sameTimestamp = false } = {}) {
    const a = await loginAs('a@test.com', 'Student');
    const b = await loginAs('b@test.com', 'Student');
    const connection = await Connection.create({
      sender:   { id: a.user._id, name: 'A', role: 'Student' },
      receiver: { id: b.user._id, name: 'B', role: 'Student' },
      status: 'Accepted',
    });
    const base = Date.now() - count * 1000;
    await ChatMessage.insertMany(Array.from({ length: count }, (_, i) => ({
      connectionId: connection._id,
      sender: { id: b.user._id, name: 'B', role: 'Student' },
      text: `msg ${i}`,
      createdAt: new Date(sameTimestamp ? base : base + i * 1000),
    })));
    return { token: a.token, url: `/api/v1/connections/${connection._id}/chat` };
  }

  it('returns the newest 50 oldest-first, then older pages via ?before', async () => {
    const { token, url } = await seedChat(120);

    const p1 = await request(testApp).get(url).set(auth(token));
    expect(p1.status).toBe(200);
    expect(p1.body.hasMore).toBe(true);
    expect(p1.body.messages.map((m) => m.text)).toEqual(
      Array.from({ length: 50 }, (_, i) => `msg ${70 + i}`)
    );

    const p2 = await request(testApp).get(url).query({ before: p1.body.messages[0]._id }).set(auth(token));
    expect(p2.body.messages[0].text).toBe('msg 20');
    expect(p2.body.messages.at(-1).text).toBe('msg 69');
    expect(p2.body.hasMore).toBe(true);

    const p3 = await request(testApp).get(url).query({ before: p2.body.messages[0]._id }).set(auth(token));
    expect(p3.body.messages).toHaveLength(20);
    expect(p3.body.hasMore).toBe(false);
  });

  it('never skips or repeats messages that share a timestamp', async () => {
    const { token, url } = await seedChat(75, { sameTimestamp: true });
    const seen = [];
    let before;
    for (let i = 0; i < 5; i++) {
      const res = await request(testApp).get(url).query({ limit: 20, ...(before && { before }) }).set(auth(token));
      seen.push(...res.body.messages.map((m) => m._id));
      if (!res.body.hasMore) break;
      before = res.body.messages[0]._id;
    }
    expect(seen).toHaveLength(75);
    expect(new Set(seen).size).toBe(75);
  });

  it('opening the chat marks messages read; a bad cursor is rejected', async () => {
    const { token, url } = await seedChat(3);
    await request(testApp).get(url).set(auth(token));
    expect(await ChatMessage.countDocuments({ readBy: { $size: 0 } })).toBe(0);

    const bad = await request(testApp).get(url).query({ before: 'not-an-id' }).set(auth(token));
    expect(bad.status).toBe(400);
  });
});

describe('Mentorship requests list', () => {
  it('supports ?status filters and ?countOnly', async () => {
    const mentor = await loginAs('mentor@test.com', 'Alumni');
    const statuses = ['Pending', 'Pending', 'Accepted', 'Completed', 'Rejected'];
    await MentorshipRequest.insertMany(statuses.map((status) => ({
      student: { id: new mongoose.Types.ObjectId(), name: 'S' },
      mentor:  { id: mentor.user._id, name: 'M', role: 'Alumni' },
      goal: 'career', slot: { day: 'Mon', time: '10:00' }, status,
    })));

    const count = await request(testApp).get('/api/v1/mentorship/requests')
      .query({ status: 'Pending', countOnly: 'true' }).set(auth(mentor.token));
    expect(count.body).toEqual({ success: true, count: 2 });

    const active = await request(testApp).get('/api/v1/mentorship/requests')
      .query({ status: 'Accepted,Completed' }).set(auth(mentor.token));
    expect(active.body.requests.map((r) => r.status).sort()).toEqual(['Accepted', 'Completed']);

    const all = await request(testApp).get('/api/v1/mentorship/requests').set(auth(mentor.token));
    expect(all.body.requests).toHaveLength(5);
  });
});

describe('Incubation feed', () => {
  it('pages newest-first with total and hasMore', async () => {
    const { token, user } = await loginAs('author@test.com', 'Student');
    await Incubation.insertMany(Array.from({ length: 25 }, (_, i) => ({
      title: `Idea ${i}`, description: 'desc',
      authorId: user._id, authorName: 'A', authorRole: 'Student',
      createdAt: new Date(Date.now() - (25 - i) * 1000),
    })));

    const p1 = await request(testApp).get('/api/v1/incubation').set(auth(token));
    expect(p1.body).toMatchObject({ total: 25, hasMore: true, count: 20 });
    expect(p1.body.ideas[0].title).toBe('Idea 24');

    const p2 = await request(testApp).get('/api/v1/incubation').query({ page: 2 }).set(auth(token));
    expect(p2.body).toMatchObject({ count: 5, hasMore: false });
  });
});

describe('Admin user lists', () => {
  it('GET /admin/users pages across roles, filters, and never leaks secrets', async () => {
    const admin = await loginAs('admin@test.com', 'Admin');
    await loginAs('stu@test.com', 'Student');            // has a hashed password
    await makeMembers(Student, 60, { prefix: 'Stu' });
    await makeMembers(Alumni, 10, { prefix: 'Alu' });

    const p1 = await request(testApp).get('/api/v1/admin/users').set(auth(admin.token));
    expect(p1.status).toBe(200);
    expect(p1.body).toMatchObject({ total: 71, hasMore: true });
    expect(p1.body.users).toHaveLength(50);
    for (const u of p1.body.users) {
      expect(u).not.toHaveProperty('password');
      expect(u).not.toHaveProperty('googleTokens');
      expect(u).not.toHaveProperty('verificationCode');
    }

    const alumni = await request(testApp).get('/api/v1/admin/users').query({ role: 'Alumni' }).set(auth(admin.token));
    expect(alumni.body.total).toBe(10);
    expect(alumni.body.users.every((u) => u.role === 'Alumni')).toBe(true);

    const search = await request(testApp).get('/api/v1/admin/users').query({ search: 'stu@test' }).set(auth(admin.token));
    expect(search.body.total).toBe(1);
  });

  it('GET /admin/users/students filters on the server and returns dropdown options', async () => {
    const admin = await loginAs('admin@test.com', 'Admin');
    await makeMembers(Student, 3, { prefix: 'Cse', extra: { department: 'CSE', enrollmentYear: 2022 } });
    await makeMembers(Student, 2, { prefix: 'Ece', extra: { department: 'ECE', enrollmentYear: 2021 } });

    const res = await request(testApp).get('/api/v1/admin/users/students')
      .query({ department: 'CSE', limit: 2 }).set(auth(admin.token));
    expect(res.body).toMatchObject({ total: 3, hasMore: true, count: 2 });
    expect(res.body.filters.departments).toEqual(['CSE', 'ECE']);
    expect(res.body.filters.classes).toEqual([2022, 2021]);
  });
});
