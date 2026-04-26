/**
 * forum.test.js — Forum API Tests
 * POST/GET/DELETE /api/v1/forum/questions
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../middlewares/error.js';
import forumRouter from '../routes/ForumRouter.js';
import userRouter from '../routes/userRouter.js';

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
testApp.use('/api/v1/forum', forumRouter);
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

// ── helper: seed a verified+adminVerified student and return token ────────────
async function seedVerifiedStudent(email = 'forum@test.com', phone = '+919876543210') {
  const { Student } = await import('../models/StudentModel.js');
  await Student.create({
    name: 'Forum User', email, phone,
    password: 'Password@123',
    accountVerified: true, adminVerified: true,
  });
  const res = await request(testApp)
    .post('/api/v1/user/login')
    .send({ email, password: 'Password@123', role: 'Student' });
  return res.body.token;
}

describe('Forum API', () => {

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  it('GET /questions — returns 400 without auth token', async () => {
    const res = await request(testApp).get('/api/v1/forum/questions');
    expect(res.status).toBe(400);
  });

  // ── Create question ──────────────────────────────────────────────────────────
  it('POST /questions — returns 400 when title is missing', async () => {
    const token = await seedVerifiedStudent();
    const res = await request(testApp)
      .post('/api/v1/forum/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'No title here' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title is required/i);
  });

  it('POST /questions — creates a question successfully', async () => {
    const token = await seedVerifiedStudent();
    const res = await request(testApp)
      .post('/api/v1/forum/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'How do I get an internship?', body: 'Need advice', tags: ['career'] });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.question.title).toBe('How do I get an internship?');
    expect(res.body.question.tags).toContain('career');
  });

  // ── Get questions ─────────────────────────────────────────────────────────────
  it('GET /questions — returns list of questions when authenticated', async () => {
    const token = await seedVerifiedStudent();
    // Seed one question first
    await request(testApp)
      .post('/api/v1/forum/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test question' });

    const res = await request(testApp)
      .get('/api/v1/forum/questions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.questions.length).toBeGreaterThan(0);
  });

  // ── Add answer ───────────────────────────────────────────────────────────────
  it('POST /questions/:id/answers — adds answer to a question', async () => {
    const token = await seedVerifiedStudent();
    const qRes = await request(testApp)
      .post('/api/v1/forum/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Q with answer' });
    const qId = qRes.body.question._id;

    const aRes = await request(testApp)
      .post(`/api/v1/forum/questions/${qId}/answers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'This is my answer.' });
    expect(aRes.status).toBe(201);
    expect(aRes.body.answer.body).toBe('This is my answer.');
  });

  it('POST /questions/:id/answers — returns 400 when body is missing', async () => {
    const token = await seedVerifiedStudent();
    const qRes = await request(testApp)
      .post('/api/v1/forum/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Q for empty answer test' });
    const qId = qRes.body.question._id;

    const res = await request(testApp)
      .post(`/api/v1/forum/questions/${qId}/answers`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/answer body is required/i);
  });

  // ── Delete question ───────────────────────────────────────────────────────────
  it('DELETE /questions/:id — author can delete own question', async () => {
    const token = await seedVerifiedStudent();
    const qRes = await request(testApp)
      .post('/api/v1/forum/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To be deleted' });
    const qId = qRes.body.question._id;

    const delRes = await request(testApp)
      .delete(`/api/v1/forum/questions/${qId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toMatch(/deleted/i);
  });

  it('DELETE /questions/:id — another user cannot delete someone elses question', async () => {
    const token1 = await seedVerifiedStudent('user1@test.com', '+919876543210');
    const token2 = await seedVerifiedStudent('user2@test.com', '+919876543211');

    const qRes = await request(testApp)
      .post('/api/v1/forum/questions')
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'User1 question' });
    const qId = qRes.body.question._id;

    const res = await request(testApp)
      .delete(`/api/v1/forum/questions/${qId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(403);
  });

  // ── Upvote ───────────────────────────────────────────────────────────────────
  it('PUT /answers/:id/upvote — cannot upvote own answer', async () => {
    const token = await seedVerifiedStudent();
    const qRes = await request(testApp)
      .post('/api/v1/forum/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Q for upvote test' });
    const qId = qRes.body.question._id;

    const aRes = await request(testApp)
      .post(`/api/v1/forum/questions/${qId}/answers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'My own answer' });
    const aId = aRes.body.answer._id;

    const upRes = await request(testApp)
      .put(`/api/v1/forum/questions/${qId}/answers/${aId}/upvote`)
      .set('Authorization', `Bearer ${token}`);
    expect(upRes.status).toBe(400);
    expect(upRes.body.message).toMatch(/cannot upvote your own/i);
  });
});
