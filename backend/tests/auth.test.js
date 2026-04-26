/**
 * auth.test.js — Backend API Tests for /api/v1/user/* routes
 *
 * These tests use Supertest to hit real Express routes with a real
 * in-memory MongoDB (MongoMemoryServer). No actual database is modified.
 *
 * Covers:
 *  POST /api/v1/user/register  — field validation
 *  POST /api/v1/user/login     — missing fields, wrong password, valid login
 *  GET  /api/v1/user/me        — unauthenticated vs authenticated access
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../middlewares/error.js';
import userRouter from '../routes/userRouter.js';

// ── Build a lightweight test app (no cron, no socket) ─────────────────────────
const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
testApp.use(errorMiddleware);

// ── In-memory MongoDB setup ────────────────────────────────────────────────────
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'test' });
  // Jest needs JWT_SECRET_KEY to sign tokens
  process.env.JWT_SECRET_KEY = 'test_secret_key_for_jest';
  process.env.JWT_EXPIRE = '7d';
  process.env.COOKIE_EXPIRE = '7';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up all collections after each test so tests don't bleed into each other
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/user/register', () => {

  it('should return 400 if required fields are missing', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/register')
      .send({ email: 'test@example.com' }); // missing name, phone, password etc.

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/required/i);
  });


  it('should return 403 if someone tries to self-register as Admin', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/register')
      .send({
        name: 'Hacker',
        email: 'hacker@example.com',
        password: 'Password@1234',
        verificationMethod: 'email',
        role: 'Admin',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin accounts cannot be self-registered/i);
  });

  it('should return 400 for an invalid role', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/register')
      .send({
        name: 'Test User',
        email: 'test@test.com',
        password: 'Password@1234',
        verificationMethod: 'email',
        role: 'SuperUser',         // not a valid role
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid role/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/user/login', () => {

  it('should return 400 if email, password or role is missing', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'user@example.com' }); // no password or role

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email, password and role are required/i);
  });

  it('should return 400 for an invalid role', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'user@example.com', password: 'test', role: 'Ghost' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid role/i);
  });

  it('should return 400 for wrong credentials (non-existent user)', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'nobody@example.com', password: 'wrongpass', role: 'Student' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should login successfully and return a JWT token for a verified student', async () => {
    // Seed a verified student directly into the in-memory DB
    const { Student } = await import('../models/StudentModel.js');
    const student = await Student.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'MyPassword@123',
      accountVerified: true,
      adminVerified: true,
    });

    const res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'student@test.com', password: 'MyPassword@123', role: 'Student' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();        // JWT token returned
    expect(res.body.user.email).toBe('student@test.com');
    expect(res.body.user.role).toBe('Student');
    expect(res.body.message).toBe('User Logged In Successfully');
  });

  it('should return 400 when a correct email is used but password is wrong', async () => {
    const { Student } = await import('../models/StudentModel.js');
    await Student.create({
      name: 'Test Student',
      email: 'student2@test.com',
      password: 'CorrectPass@123',
      accountVerified: true,
    });

    const res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'student2@test.com', password: 'WrongPass@123', role: 'Student' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should lock the account for 30 minutes after 3 failed login attempts', async () => {
    const { Student } = await import('../models/StudentModel.js');
    await Student.create({
      name: 'Brute Force Student',
      email: 'brute@test.com',
      password: 'CorrectPass@123',
      accountVerified: true,
    });

    // Attempt 1
    let res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'brute@test.com', password: 'WrongPass@123', role: 'Student' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/attempts left/i);

    // Attempt 2
    res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'brute@test.com', password: 'WrongPass@123', role: 'Student' });
    expect(res.status).toBe(400);

    // Attempt 3 (Should lock)
    res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'brute@test.com', password: 'WrongPass@123', role: 'Student' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/locked for 30 minutes/i);

    // Attempt 4 (Should remain locked even with correct password)
    res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'brute@test.com', password: 'CorrectPass@123', role: 'Student' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/temporarily locked/i);
  });

  it('should return 403 when a blocked user tries to login', async () => {
    const { Student } = await import('../models/StudentModel.js');
    await Student.create({
      name: 'Blocked Student',
      email: 'blocked@test.com',
      password: 'MyPassword@123',
      accountVerified: true,
      isBlocked: true,
    });

    const res = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'blocked@test.com', password: 'MyPassword@123', role: 'Student' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/suspended/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /me (getUser) TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/user/me', () => {

  it('should return 400 if no token is provided', async () => {
    const res = await request(testApp).get('/api/v1/user/me');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not authenticated/i);
  });

  it('should return logged-in user details when a valid token is provided', async () => {
    // Step 1: seed a verified student
    const { Student } = await import('../models/StudentModel.js');
    await Student.create({
      name: 'Me Student',
      email: 'me@test.com',
      password: 'MyPassword@123',
      accountVerified: true,
      adminVerified: true,
    });

    // Step 2: login to get a real JWT
    const loginRes = await request(testApp)
      .post('/api/v1/user/login')
      .send({ email: 'me@test.com', password: 'MyPassword@123', role: 'Student' });

    const token = loginRes.body.token;

    // Step 3: call /me with the Bearer token
    const meRes = await request(testApp)
      .get('/api/v1/user/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.email).toBe('me@test.com');
    expect(meRes.body.user.role).toBe('Student');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/user/password/forgot', () => {

  it('should return 400 for an invalid role', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/password/forgot')
      .send({ email: 'user@test.com', role: 'Robot' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid role/i);
  });

  it('should return 404 if user not found', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/password/forgot')
      .send({ email: 'ghost@test.com', role: 'Student' });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });
});
