/**
 * admin.test.js — Admin User API Tests
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../Socket.js', () => ({ emitToUser: jest.fn() }));

const { default: adminRouter } = await import('../routes/AdminUserRouter.js');
const { default: userRouter } = await import('../routes/userRouter.js');
const { errorMiddleware } = await import('../middlewares/error.js');
const { Student } = await import('../models/StudentModel.js');

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
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

async function loginAs(email, phone, Model, password = 'Password@123') {
  const { [Model]: m } = await import(`../models/${Model}Model.js`);
  const user = await m.create({ name: 'Test User', email, phone, password, accountVerified: true, adminVerified: true });
  const role = Model;
  const res = await request(testApp).post('/api/v1/user/login').send({ email, password, role });
  return { token: res.body.token, userId: user._id.toString() };
}

describe('Admin API', () => {

  it('GET / — Returns all users for Admin', async () => {
    // Create users
    await loginAs('admin@test.com', '+919876543210', 'Admin');
    await loginAs('student@test.com', '+919876543211', 'Student');
    await loginAs('alumni@test.com', '+919876543212', 'Alumni');

    // Login as Admin
    const resLogin = await request(testApp).post('/api/v1/user/login').send({ email: 'admin@test.com', password: 'Password@123', role: 'Admin' });
    const token = resLogin.body.token;

    const res = await request(testApp).get('/api/v1/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    // At least 2 users (Student and Alumni)
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
  });

  it('GET / — Returns 403 for non-Admin', async () => {
    const { token } = await loginAs('student2@test.com', '+919876543213', 'Student');
    const res = await request(testApp).get('/api/v1/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('PUT /:role/:id/verify — Admin can verify a user', async () => {
    // Create an unverified student manually
    const student = await Student.create({
      name: 'Unverified Student',
      email: 'uv@test.com',
      phone: '+919876543214',
      password: 'Password@123',
      accountVerified: true,
      adminVerified: false // Needs verification
    });

    const { token } = await loginAs('admin2@test.com', '+919876543215', 'Admin');

    const res = await request(testApp)
      .put(`/api/v1/admin/users/Student/${student._id}/verify`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verified successfully/i);
    
    // Check DB
    const updatedStudent = await Student.findById(student._id);
    expect(updatedStudent.adminVerified).toBe(true);
  });

  it('PUT /:role/:id/block — Admin can block a user', async () => {
    // Create a verified student
    const { userId } = await loginAs('student3@test.com', '+919876543216', 'Student');
    const { token } = await loginAs('admin3@test.com', '+919876543217', 'Admin');

    const res = await request(testApp)
      .put(`/api/v1/admin/users/Student/${userId}/block`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/blocked successfully/i);
    
    // Check DB
    const updatedStudent = await Student.findById(userId);
    expect(updatedStudent.isBlocked).toBe(true);
  });
});
