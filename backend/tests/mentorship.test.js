/**
 * mentorship.test.js — Mentorship API Tests
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../Socket.js', () => ({ emitToUser: jest.fn() }));

const { default: mentorshipRouter } = await import('../routes/MentorshipRouter.js');
const { default: userRouter } = await import('../routes/userRouter.js');
const { errorMiddleware } = await import('../middlewares/error.js');

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
testApp.use('/api/v1/mentorship', mentorshipRouter);
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

async function loginAs(email, phone, Model, password = 'Password@123', extraFields = {}) {
  const { [Model]: m } = await import(`../models/${Model}Model.js`);
  const user = await m.create({ name: 'Test User', email, phone, password, accountVerified: true, adminVerified: true, ...extraFields });
  const role = Model;
  const res = await request(testApp).post('/api/v1/user/login').send({ email, password, role });
  return { token: res.body.token, userId: user._id.toString() };
}

describe('Mentorship API', () => {

  it('GET /mentors — returns mentors available for mentorship', async () => {
    // Create an available mentor
    await loginAs('mentor1@test.com', '+919876543210', 'Alumni', 'Password@123', {
      availableForMentorship: true,
      mentorshipSlots: [{ day: 'Monday', time: '10:00 AM', booked: false }]
    });

    // Create an unavailable mentor
    await loginAs('mentor2@test.com', '+919876543211', 'Teacher', 'Password@123', {
      availableForMentorship: false
    });

    const { token } = await loginAs('student@test.com', '+919876543212', 'Student');
    const res = await request(testApp).get('/api/v1/mentorship/mentors').set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.mentors.length).toBe(1);
    expect(res.body.mentors[0].role).toBe('Alumni');
  });

  it('PUT /settings/availability — Mentor can update settings', async () => {
    const { token } = await loginAs('mentor3@test.com', '+919876543213', 'Alumni');
    const res = await request(testApp)
      .put('/api/v1/mentorship/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        availableForMentorship: true,
        weeklyLimit: 3,
        mentorshipSlots: [{ day: 'Friday', time: '02:00 PM', booked: false }]
      });

    expect(res.status).toBe(200);
    expect(res.body.settings.availableForMentorship).toBe(true);
    expect(res.body.settings.mentorshipSlots.length).toBe(1);
  });

  it('POST /requests — Student can send a mentorship request', async () => {
    const { userId: mentorId } = await loginAs('mentor4@test.com', '+919876543214', 'Alumni', 'Password@123', {
      availableForMentorship: true,
      mentorshipSlots: [{ day: 'Tuesday', time: '04:00 PM', booked: false }]
    });
    const { token } = await loginAs('student2@test.com', '+919876543215', 'Student');
    
    const res = await request(testApp)
      .post('/api/v1/mentorship/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mentorId,
        goal: 'career',
        slot: { day: 'Tuesday', time: '04:00 PM' }
      });

    expect(res.status).toBe(201);
    expect(res.body.request.status).toBe('Pending');
  });

  it('POST /requests — Returns 400 if slot is not available in mentor settings', async () => {
    const { userId: mentorId } = await loginAs('mentor5@test.com', '+919876543216', 'Alumni', 'Password@123', {
      availableForMentorship: true,
      mentorshipSlots: [{ day: 'Tuesday', time: '04:00 PM', booked: false }]
    });
    const { token } = await loginAs('student3@test.com', '+919876543217', 'Student');
    
    const res = await request(testApp)
      .post('/api/v1/mentorship/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mentorId,
        goal: 'career',
        slot: { day: 'Friday', time: '04:00 PM' } // Different slot
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not available/i);
  });

  it('PUT /requests/:id/respond — Mentor can accept a request', async () => {
    const { token: mentorToken, userId: mentorId } = await loginAs('mentor6@test.com', '+919876543218', 'Alumni', 'Password@123', {
      availableForMentorship: true,
      weeklyLimit: 5,
      mentorshipSlots: [{ day: 'Wednesday', time: '11:00 AM', booked: false }]
    });
    const { token: studentToken } = await loginAs('student4@test.com', '+919876543219', 'Student');
    
    // Create Request
    const reqRes = await request(testApp).post('/api/v1/mentorship/requests').set('Authorization', `Bearer ${studentToken}`).send({
      mentorId, goal: 'resume', slot: { day: 'Wednesday', time: '11:00 AM' }
    });
    const requestId = reqRes.body.request._id;

    // Mentor accepts
    const res = await request(testApp)
      .put(`/api/v1/mentorship/requests/${requestId}/respond`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ status: 'Accepted' });

    expect(res.status).toBe(200);
    expect(res.body.mentorship.status).toBe('Accepted');
  });

  it('GET /requests — returns only users own requests', async () => {
    const { token: mentorToken, userId: mentorId } = await loginAs('mentor7@test.com', '+919876543220', 'Alumni', 'Password@123', {
      availableForMentorship: true,
      mentorshipSlots: [{ day: 'Thursday', time: '01:00 PM', booked: false }]
    });
    const { token: studentToken } = await loginAs('student5@test.com', '+919876543221', 'Student');
    
    await request(testApp).post('/api/v1/mentorship/requests').set('Authorization', `Bearer ${studentToken}`).send({
      mentorId, goal: 'interview', slot: { day: 'Thursday', time: '01:00 PM' }
    });

    const resStudent = await request(testApp).get('/api/v1/mentorship/requests').set('Authorization', `Bearer ${studentToken}`);
    expect(resStudent.status).toBe(200);
    expect(resStudent.body.requests.length).toBe(1);

    const resMentor = await request(testApp).get('/api/v1/mentorship/requests').set('Authorization', `Bearer ${mentorToken}`);
    expect(resMentor.status).toBe(200);
    expect(resMentor.body.requests.length).toBe(1);
  });
});
