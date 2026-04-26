/**
 * events.test.js — Events API Tests
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../middlewares/error.js';
import eventRouter from '../routes/EventRouter.js';
import userRouter from '../routes/userRouter.js';

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
testApp.use('/api/v1/events', eventRouter);
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

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 10); // 10 days in the future

const validEvent = {
  title: 'Tech Meetup',
  description: 'Join us for tech talk',
  date: futureDate.toISOString(),
  time: '18:00',
  location: 'Hall A',
};

describe('Events API', () => {

  it('POST / — Student cannot create an event (403)', async () => {
    const { token } = await loginAs('student@test.com', '+919876543210', 'Student');
    const res = await request(testApp).post('/api/v1/events').set('Authorization', `Bearer ${token}`).send(validEvent);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/students cannot post/i);
  });

  it('POST / — Alumni can create an event', async () => {
    const { token } = await loginAs('alumni@test.com', '+919876543211', 'Alumni');
    const res = await request(testApp).post('/api/v1/events').set('Authorization', `Bearer ${token}`).send(validEvent);
    expect(res.status).toBe(201);
    expect(res.body.event.title).toBe('Tech Meetup');
  });

  it('POST / — returns 400 for past event date', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const { token } = await loginAs('alumni2@test.com', '+919876543212', 'Alumni');
    const res = await request(testApp).post('/api/v1/events').set('Authorization', `Bearer ${token}`).send({ ...validEvent, date: pastDate.toISOString() });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/future/i);
  });

  it('GET / — returns events with correct view filter', async () => {
    const { token } = await loginAs('alumni3@test.com', '+919876543213', 'Alumni');
    await request(testApp).post('/api/v1/events').set('Authorization', `Bearer ${token}`).send(validEvent);
    const res = await request(testApp).get('/api/v1/events?view=upcoming').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.events.length).toBeGreaterThan(0);
  });

  it('POST /:eventId/register — Admin cannot register for events', async () => {
    const { token: adminToken } = await loginAs('admin@test.com', '+919876543214', 'Admin');
    const { token: alumniToken } = await loginAs('alumni4@test.com', '+919876543215', 'Alumni');
    
    // Alumni creates event
    const postRes = await request(testApp).post('/api/v1/events').set('Authorization', `Bearer ${alumniToken}`).send(validEvent);
    const eventId = postRes.body.event._id;

    // Admin tries to register
    const res = await request(testApp).post(`/api/v1/events/${eventId}/register`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admins cannot register/i);
  });

  it('POST /:eventId/register — Organizer cannot register for own event', async () => {
    const { token: alumniToken } = await loginAs('alumni5@test.com', '+919876543216', 'Alumni');
    const postRes = await request(testApp).post('/api/v1/events').set('Authorization', `Bearer ${alumniToken}`).send(validEvent);
    const eventId = postRes.body.event._id;

    const res = await request(testApp).post(`/api/v1/events/${eventId}/register`).set('Authorization', `Bearer ${alumniToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/cannot register for an event you created/i);
  });

  it('POST /:eventId/register — Student can register and unregister (toggle)', async () => {
    const { token: alumniToken } = await loginAs('alumni6@test.com', '+919876543217', 'Alumni');
    const { token: studentToken } = await loginAs('student2@test.com', '+919876543218', 'Student');
    
    const postRes = await request(testApp).post('/api/v1/events').set('Authorization', `Bearer ${alumniToken}`).send(validEvent);
    const eventId = postRes.body.event._id;

    // Register
    const regRes = await request(testApp).post(`/api/v1/events/${eventId}/register`).set('Authorization', `Bearer ${studentToken}`);
    expect(regRes.status).toBe(200);
    expect(regRes.body.registered).toBe(true);

    // Unregister (toggle)
    const unregRes = await request(testApp).post(`/api/v1/events/${eventId}/register`).set('Authorization', `Bearer ${studentToken}`);
    expect(unregRes.status).toBe(200);
    expect(unregRes.body.registered).toBe(false);
  });

  it('DELETE /:eventId — Organizer can delete their event', async () => {
    const { token } = await loginAs('alumni7@test.com', '+919876543219', 'Alumni');
    const postRes = await request(testApp).post('/api/v1/events').set('Authorization', `Bearer ${token}`).send(validEvent);
    const eventId = postRes.body.event._id;

    const res = await request(testApp).delete(`/api/v1/events/${eventId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });
});
