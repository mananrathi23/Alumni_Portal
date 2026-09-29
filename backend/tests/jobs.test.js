/**
 * jobs.test.js — Jobs API Tests
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../middlewares/error.js';
import jobRouter from '../routes/JobRouter.js';
import userRouter from '../routes/userRouter.js';

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
testApp.use('/api/v1/jobs', jobRouter);
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

async function loginAlumni(email, phone) {
  const { Alumni } = await import('../models/AlumniModel.js');
  await Alumni.create({ name: 'Test Alumni', email, phone, password: 'Password@123', accountVerified: true, adminVerified: true });
  const res = await request(testApp).post('/api/v1/user/login').send({ email, password: 'Password@123', role: 'Alumni' });
  return res.body.token;
}

async function loginStudent(email, phone) {
  const { Student } = await import('../models/StudentModel.js');
  await Student.create({ name: 'Test Student', email, phone, password: 'Password@123', accountVerified: true, adminVerified: true });
  const res = await request(testApp).post('/api/v1/user/login').send({ email, password: 'Password@123', role: 'Student' });
  return res.body.token;
}

const validJob = { company: 'Google', role: 'Engineer', description: 'Build things.' };

describe('Jobs API', () => {

  it('POST / — Student cannot post a job (403)', async () => {
    const token = await loginStudent('student@test.com', '+919876543210');
    const res = await request(testApp).post('/api/v1/jobs').set('Authorization', `Bearer ${token}`).send(validJob);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/students cannot post/i);
  });

  it('POST / — Alumni can post a job successfully', async () => {
    const token = await loginAlumni('alumni@test.com', '+919876543211');
    const res = await request(testApp).post('/api/v1/jobs').set('Authorization', `Bearer ${token}`).send(validJob);
    expect(res.status).toBe(201);
    expect(res.body.job.company).toBe('Google');
  });

  it('POST / — returns 400 when company is missing', async () => {
    const token = await loginAlumni('alumni2@test.com', '+919876543212');
    const res = await request(testApp).post('/api/v1/jobs').set('Authorization', `Bearer ${token}`).send({ role: 'Eng', description: 'desc' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/company name is required/i);
  });

  it('POST / — returns 400 for a past deadline', async () => {
    const token = await loginAlumni('alumni3@test.com', '+919876543213');
    const res = await request(testApp).post('/api/v1/jobs').set('Authorization', `Bearer ${token}`).send({ ...validJob, deadline: '2020-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/future date/i);
  });

  it('GET / — returns list of jobs when authenticated', async () => {
    const token = await loginAlumni('alumni4@test.com', '+919876543214');
    await request(testApp).post('/api/v1/jobs').set('Authorization', `Bearer ${token}`).send(validJob);
    const res = await request(testApp).get('/api/v1/jobs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBeGreaterThan(0);
  });

  it('DELETE /:jobId — poster can delete their own job', async () => {
    const token = await loginAlumni('alumni5@test.com', '+919876543215');
    const postRes = await request(testApp).post('/api/v1/jobs').set('Authorization', `Bearer ${token}`).send(validJob);
    const jobId = postRes.body.job._id;
    const res = await request(testApp).delete(`/api/v1/jobs/${jobId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });

  it('DELETE /:jobId — another user cannot delete someone elses job', async () => {
    const t1 = await loginAlumni('alumni6@test.com', '+919876543216');
    const t2 = await loginAlumni('alumni7@test.com', '+919876543217');
    const postRes = await request(testApp).post('/api/v1/jobs').set('Authorization', `Bearer ${t1}`).send(validJob);
    const jobId = postRes.body.job._id;
    const res = await request(testApp).delete(`/api/v1/jobs/${jobId}`).set('Authorization', `Bearer ${t2}`);
    expect(res.status).toBe(403);
  });
});
