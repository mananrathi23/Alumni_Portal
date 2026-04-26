/**
 * connections.test.js — Connection Request API Tests
 *
 * Uses jest.unstable_mockModule to mock Socket.js (ESM-compatible)
 * so emitToUser doesn't crash without a real Socket.io server.
 */
import { jest } from '@jest/globals';

// ESM mock — must come before any imports that use Socket.js
jest.unstable_mockModule('../Socket.js', () => ({ emitToUser: jest.fn() }));

// Dynamic imports after mock is registered
const { default: mongoose } = await import('mongoose');
const { MongoMemoryServer } = await import('mongodb-memory-server');
const { default: request } = await import('supertest');
const { default: express } = await import('express');
const { default: cookieParser } = await import('cookie-parser');
const { errorMiddleware } = await import('../middlewares/error.js');
const { default: connectionRouter } = await import('../routes/ConnectionRouter.js');
const { default: userRouter } = await import('../routes/userRouter.js');

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
testApp.use('/api/v1/connections', connectionRouter);
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

async function seedAndLogin(email, phone) {
  const { Student } = await import('../models/StudentModel.js');
  const user = await Student.create({ name: 'User', email, phone, password: 'Password@123', accountVerified: true, adminVerified: true });
  const res = await request(testApp).post('/api/v1/user/login').send({ email, password: 'Password@123', role: 'Student' });
  return { token: res.body.token, userId: user._id.toString() };
}

describe('Connections API', () => {

  it('POST /send — returns 400 when receiverId is missing', async () => {
    const { token } = await seedAndLogin('s1@test.com', '+919876543210');
    const res = await request(testApp).post('/api/v1/connections/send').set('Authorization', `Bearer ${token}`).send({ receiverRole: 'Student' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/receiver id and role are required/i);
  });

  it('POST /send — cannot send request to yourself', async () => {
    const { token, userId } = await seedAndLogin('s2@test.com', '+919876543211');
    const res = await request(testApp).post('/api/v1/connections/send').set('Authorization', `Bearer ${token}`).send({ receiverId: userId, receiverRole: 'Student' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot send.*yourself/i);
  });

  it('POST /send — sends request to another user successfully', async () => {
    const { token: t1 } = await seedAndLogin('s3@test.com', '+919876543212');
    const { userId: id2 } = await seedAndLogin('s4@test.com', '+919876543213');
    const res = await request(testApp).post('/api/v1/connections/send').set('Authorization', `Bearer ${t1}`).send({ receiverId: id2, receiverRole: 'Student' });
    expect(res.status).toBe(201);
    expect(res.body.request.status).toBe('Pending');
  });

  it('POST /send — cannot send duplicate pending request', async () => {
    const { token: t1 } = await seedAndLogin('s5@test.com', '+919876543214');
    const { userId: id2 } = await seedAndLogin('s6@test.com', '+919876543215');
    await request(testApp).post('/api/v1/connections/send').set('Authorization', `Bearer ${t1}`).send({ receiverId: id2, receiverRole: 'Student' });
    const res = await request(testApp).post('/api/v1/connections/send').set('Authorization', `Bearer ${t1}`).send({ receiverId: id2, receiverRole: 'Student' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already pending/i);
  });

  it('PUT /:id/respond — receiver can accept a pending request', async () => {
    const { token: t1 } = await seedAndLogin('s7@test.com', '+919876543216');
    const { token: t2, userId: id2 } = await seedAndLogin('s8@test.com', '+919876543217');
    const sendRes = await request(testApp).post('/api/v1/connections/send').set('Authorization', `Bearer ${t1}`).send({ receiverId: id2, receiverRole: 'Student' });
    const reqId = sendRes.body.request._id;
    const res = await request(testApp).put(`/api/v1/connections/${reqId}/respond`).set('Authorization', `Bearer ${t2}`).send({ status: 'Accepted' });
    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('Accepted');
  });

  it('PUT /:id/respond — sender cannot respond to their own request', async () => {
    const { token: t1 } = await seedAndLogin('s9@test.com', '+919876543218');
    const { userId: id2 } = await seedAndLogin('s10@test.com', '+919876543219');
    const sendRes = await request(testApp).post('/api/v1/connections/send').set('Authorization', `Bearer ${t1}`).send({ receiverId: id2, receiverRole: 'Student' });
    const reqId = sendRes.body.request._id;
    const res = await request(testApp).put(`/api/v1/connections/${reqId}/respond`).set('Authorization', `Bearer ${t1}`).send({ status: 'Accepted' });
    expect(res.status).toBe(403);
  });

  it('GET / — returns accepted connections list', async () => {
    const { token: t1 } = await seedAndLogin('s11@test.com', '+919876543220');
    const { token: t2, userId: id2 } = await seedAndLogin('s12@test.com', '+919876543221');
    const sendRes = await request(testApp).post('/api/v1/connections/send').set('Authorization', `Bearer ${t1}`).send({ receiverId: id2, receiverRole: 'Student' });
    const reqId = sendRes.body.request._id;
    await request(testApp).put(`/api/v1/connections/${reqId}/respond`).set('Authorization', `Bearer ${t2}`).send({ status: 'Accepted' });
    const res = await request(testApp).get('/api/v1/connections').set('Authorization', `Bearer ${t1}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });
});
