/**
 * otp.test.js — OTP Verification API Tests
 * POST /api/v1/user/otp-verification
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../middlewares/error.js';
import userRouter from '../routes/userRouter.js';

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
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

// ── helper: create an unverified student with a known OTP ─────────────────────
async function seedStudentWithOtp(overrides = {}) {
  const { Student } = await import('../models/StudentModel.js');
  const student = await Student.create({
    name: 'OTP User',
    email: 'otp@test.com',
    password: 'Password@123',
    accountVerified: false,
    ...overrides,
  });
  const code = student.generateVerificationCode();
  await student.save();
  return { student, code };
}

describe('POST /api/v1/user/otp-verification', () => {

  it('should return 400 for an invalid role', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/otp-verification')
      .send({ email: 'otp@test.com', otp: '12345', role: 'Robot' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid role/i);
  });

  it('should return 404 if user is not found', async () => {
    const res = await request(testApp)
      .post('/api/v1/user/otp-verification')
      .send({ email: 'nobody@test.com', otp: '12345', role: 'Student' });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });

  it('should return 400 for a wrong OTP', async () => {
    await seedStudentWithOtp();
    const res = await request(testApp)
      .post('/api/v1/user/otp-verification')
      .send({ email: 'otp@test.com', otp: '00000', role: 'Student' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid otp/i);
  });

  it('should return 400 for an expired OTP', async () => {
    const { Student } = await import('../models/StudentModel.js');
    await Student.create({
      name: 'Exp User',
      email: 'exp@test.com',
      password: 'Password@123',
      accountVerified: false,
      verificationCode: 11111,
      verificationCodeExpire: new Date(Date.now() - 1000), // already expired
    });

    const res = await request(testApp)
      .post('/api/v1/user/otp-verification')
      .send({ email: 'exp@test.com', otp: '11111', role: 'Student' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('should verify account and return JWT for a correct OTP', async () => {
    const { code } = await seedStudentWithOtp();
    const res = await request(testApp)
      .post('/api/v1/user/otp-verification')
      .send({ email: 'otp@test.com', otp: String(code), role: 'Student' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.message).toBe('Account Verified');
  });
});
