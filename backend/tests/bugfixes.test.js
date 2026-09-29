/**
 * bugfixes.test.js — regression tests for the security/correctness audit fixes.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../Socket.js', () => ({ emitToUser: jest.fn(), emitToAll: jest.fn(), emitFeedUpdated: jest.fn() }));

const { default: userRouter } = await import('../routes/userRouter.js');
const { default: eventRouter } = await import('../routes/EventRouter.js');
const { default: forumRouter } = await import('../routes/ForumRouter.js');
const { default: incubationRouter } = await import('../routes/IncubationRouter.js');
const { default: mentorshipRouter } = await import('../routes/MentorshipRouter.js');
const { default: jobRouter } = await import('../routes/JobRouter.js');
const { errorMiddleware } = await import('../middlewares/error.js');
const { Event } = await import('../models/EventModel.js');
const { Question } = await import('../models/ForumModel.js');
const { Incubation } = await import('../models/IncubationModel.js');
const { MentorshipRequest } = await import('../models/MentorshipRequestModel.js');
const { Alumni } = await import('../models/AlumniModel.js');
const { getNextSlotISO, decodeOAuthState, buildGoogleAuthUrl } = await import('../utils/googleCalendar.js');

const testApp = express();
testApp.use(cookieParser());
testApp.use(express.json());
testApp.use('/api/v1/user', userRouter);
testApp.use('/api/v1/events', eventRouter);
testApp.use('/api/v1/forum', forumRouter);
testApp.use('/api/v1/incubation', incubationRouter);
testApp.use('/api/v1/mentorship', mentorshipRouter);
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
afterAll(async () => { await mongoose.disconnect(); await mongoServer.stop(); });
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});

let seq = 0;
async function loginAs(Model, extra = {}) {
  const email = `u${seq++}@test.com`;
  const { [Model]: m } = await import(`../models/${Model}Model.js`);
  const user = await m.create({ name: `${Model} ${seq}`, email, password: 'Password@123', accountVerified: true, adminVerified: true, ...extra });
  const res = await request(testApp).post('/api/v1/user/login').send({ email, password: 'Password@123', role: Model });
  return { token: res.body.token, user, id: user._id.toString(), loginBody: res.body };
}
const auth = (t) => ({ Authorization: `Bearer ${t}` });

describe('Accounts', () => {
  it('login never returns the password hash, OTP or reset fields', async () => {
    const { loginBody } = await loginAs('Student');
    expect(loginBody.user).toBeDefined();
    for (const f of ['password', 'verificationCode', 'resetPasswordToken', 'loginAttempts', 'lockUntil']) {
      expect(loginBody.user).not.toHaveProperty(f);
    }
  });

  it('rejects javascript: profile links and accepts https ones', async () => {
    const { token } = await loginAs('Student');
    const bad = await request(testApp).put('/api/v1/user/update-profile').set(auth(token)).send({ linkedIn: 'javascript:alert(document.cookie)' });
    expect(bad.status).toBe(400);
    const ok = await request(testApp).put('/api/v1/user/update-profile').set(auth(token)).send({ linkedIn: 'https://linkedin.com/in/me' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.linkedIn).toBe('https://linkedin.com/in/me');
    expect(ok.body.user).not.toHaveProperty('password');
  });

  it('saves a teacher\'s GitHub link and skills', async () => {
    const { token } = await loginAs('Teacher');
    const res = await request(testApp).put('/api/v1/user/update-profile').set(auth(token))
      .send({ github: 'https://github.com/prof', skills: ['ML', 'Databases'] });
    expect(res.body.user.github).toBe('https://github.com/prof');
    expect(res.body.user.skills).toEqual(['ML', 'Databases']);
  });

  it('reset password requires a new password', async () => {
    const res = await request(testApp).put('/api/v1/user/password/reset/sometoken').send({});
    expect(res.status).toBe(400);
  });

  it('profile photo must be an image data URI', async () => {
    const { token } = await loginAs('Student');
    const res = await request(testApp).post('/api/v1/user/upload-photo').set(auth(token))
      .send({ photo: 'data:text/html;base64,PHNjcmlwdD4=' });
    expect(res.status).toBe(400);
  });
});

describe('Events', () => {
  const futureEvent = (organizer, extra = {}) => Event.create({
    title: 'Meetup', description: 'd', date: new Date(Date.now() + 7 * 864e5), time: '10:00', location: 'Hall',
    organizer: { id: organizer.user._id, name: organizer.user.name, role: 'Alumni' }, ...extra,
  });

  it('only the organizer sees who registered; others get a count and their own status', async () => {
    const organizer = await loginAs('Alumni');
    const a = await loginAs('Student');
    const b = await loginAs('Student');
    const event = await futureEvent(organizer);
    await request(testApp).post(`/api/v1/events/${event._id}/register`).set(auth(a.token));

    const asB = await request(testApp).get(`/api/v1/events/${event._id}`).set(auth(b.token));
    expect(asB.body.event.registeredStudents).toEqual([]);
    expect(asB.body.event).toMatchObject({ registeredCount: 1, isRegistered: false });

    const asA = await request(testApp).get('/api/v1/events').set(auth(a.token));
    expect(asA.body.events[0]).toMatchObject({ isRegistered: true, registeredCount: 1, registeredStudents: [] });

    const asOrganizer = await request(testApp).get(`/api/v1/events/${event._id}`).set(auth(organizer.token));
    expect(asOrganizer.body.event.registeredStudents[0].email).toBe(a.user.email);
  });

  it('parallel registrations by one user count once', async () => {
    const organizer = await loginAs('Alumni');
    const s = await loginAs('Student');
    const event = await futureEvent(organizer);
    await Promise.all([1, 2, 3].map(() => Event.updateOne({ _id: event._id }, { $addToSet: { registeredStudents: s.user._id } })));
    expect((await Event.findById(event._id)).registeredStudents).toHaveLength(1);
  });

  it('hides events meant for another audience', async () => {
    const organizer = await loginAs('Alumni');
    const s = await loginAs('Student');
    const event = await futureEvent(organizer, { audience: 'Alumni' });
    expect((await request(testApp).get(`/api/v1/events/${event._id}`).set(auth(s.token))).status).toBe(404);
  });

  it('rejects javascript: event links', async () => {
    const organizer = await loginAs('Alumni');
    const res = await request(testApp).post('/api/v1/events').set(auth(organizer.token)).send({
      title: 't', description: 'd', date: new Date(Date.now() + 864e5).toISOString(), time: '10:00', link: 'javascript:alert(1)',
    });
    expect(res.status).toBe(400);
  });
});

describe('Forum', () => {
  it('bounds page/limit, sorts "top" by answer count, and never exposes viewedBy', async () => {
    const s = await loginAs('Student');
    const author = { id: s.user._id, name: 'S', role: 'Student' };
    const answer = () => ({ author, body: 'a', upvotes: [] });
    await Question.create([
      { author, title: 'one answer', answers: [answer()] },
      { author, title: 'three answers', answers: [answer(), answer(), answer()] },
      { author, title: 'none', answers: [] },
    ]);

    const zero = await request(testApp).get('/api/v1/forum/questions?limit=0&page=0').set(auth(s.token));
    expect(zero.status).toBe(200);
    expect(zero.body.questions.length).toBeLessThanOrEqual(15);

    const top = await request(testApp).get('/api/v1/forum/questions?sort=top').set(auth(s.token));
    expect(top.body.questions.map((q) => q.title)).toEqual(['three answers', 'one answer', 'none']);
    expect(top.body.questions[0].answerCount).toBe(3);

    const one = await request(testApp).get(`/api/v1/forum/questions/${top.body.questions[0]._id}`).set(auth(s.token));
    expect(one.body.question).not.toHaveProperty('viewedBy');
  });
});

describe('Incubation', () => {
  it('only the author sees who is interested', async () => {
    const author = await loginAs('Student');
    const other = await loginAs('Student');
    const idea = await Incubation.create({
      title: 'Idea', description: 'd', authorId: author.user._id, authorName: 'A', authorRole: 'Student',
      interestedUsers: [{ userId: other.user._id, name: 'O', role: 'Student', type: 'collaborator', message: 'private note' }],
    });

    const asOther = await request(testApp).get(`/api/v1/incubation/${idea._id}`).set(auth(other.token));
    expect(asOther.body.idea.interestedUsers).toEqual([]);
    expect(asOther.body.idea).toMatchObject({ interestedCount: 1, amInterested: true });

    const asAuthor = await request(testApp).get('/api/v1/incubation').set(auth(author.token));
    expect(asAuthor.body.ideas[0].interestedUsers[0].message).toBe('private note');
  });
});

describe('Mentorship', () => {
  it('blocked or unverified mentors are not listed', async () => {
    const student = await loginAs('Student');
    const slot = [{ day: 'Mon', time: '10:00 AM', booked: false }];
    await Alumni.create([
      { name: 'Good', email: 'good@t.com', accountVerified: true, adminVerified: true, availableForMentorship: true, mentorshipSlots: slot },
      { name: 'Blocked', email: 'blk@t.com', accountVerified: true, adminVerified: true, isBlocked: true, availableForMentorship: true, mentorshipSlots: slot },
      { name: 'Unverified', email: 'unv@t.com', accountVerified: true, adminVerified: false, availableForMentorship: true, mentorshipSlots: slot },
    ]);
    const res = await request(testApp).get('/api/v1/mentorship/mentors').set(auth(student.token));
    expect(res.body.mentors.map((m) => m.name)).toEqual(['Good']);
  });

  it('ratings must be whole numbers and count only once', async () => {
    const student = await loginAs('Student');
    const mentor = await loginAs('Alumni');
    const session = await MentorshipRequest.create({
      student: { id: student.user._id, name: 'S' }, mentor: { id: mentor.user._id, name: 'M', role: 'Alumni' },
      goal: 'career', slot: { day: 'Mon', time: '10:00' }, status: 'Completed',
    });
    const rate = (value) => request(testApp).post(`/api/v1/mentorship/requests/${session._id}/rate`).set(auth(student.token)).send({ value });

    expect((await rate(4.5)).status).toBe(400);
    const results = await Promise.all([rate('5'), rate('5')]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);

    const stats = (await Alumni.findById(mentor.user._id).lean()).mentorStats;
    expect(stats).toMatchObject({ totalRatings: 1, sumRatings: 5, averageRating: 5 });
  });

  it('rejects javascript: meeting links', async () => {
    const student = await loginAs('Student');
    const mentor = await loginAs('Alumni');
    const session = await MentorshipRequest.create({
      student: { id: student.user._id, name: 'S' }, mentor: { id: mentor.user._id, name: 'M', role: 'Alumni' },
      goal: 'career', slot: { day: 'Mon', time: '10:00' }, status: 'Accepted',
    });
    const res = await request(testApp).put(`/api/v1/mentorship/requests/${session._id}/meeting-link`)
      .set(auth(mentor.token)).send({ link: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
  });

  it('slot times are India time regardless of the server timezone', () => {
    const iso = getNextSlotISO('Mon', '10:00 AM');
    const ist = new Date(new Date(iso).getTime() + 330 * 60 * 1000);
    expect([ist.getUTCDay(), ist.getUTCHours(), ist.getUTCMinutes()]).toEqual([1, 10, 0]);
    expect(new Date(iso) > new Date()).toBe(true);
  });

  it('Google Calendar state is signed and cannot be forged', () => {
    process.env.GOOGLE_CLIENT_ID = 'cid';
    const state = new URL(buildGoogleAuthUrl('abc', 'Alumni')).searchParams.get('state');
    expect(decodeOAuthState(state)).toEqual({ mentorId: 'abc', mentorRole: 'Alumni' });

    const forged = Buffer.from(JSON.stringify({ mentorId: 'victim', mentorRole: 'Alumni' })).toString('base64');
    expect(() => decodeOAuthState(forged)).toThrow();
  });
});

describe('Jobs', () => {
  it('bounds limit and rejects javascript: application links', async () => {
    const alumni = await loginAs('Alumni');
    const bad = await request(testApp).post('/api/v1/jobs').set(auth(alumni.token))
      .send({ company: 'C', role: 'R', description: 'D', link: 'javascript:alert(1)' });
    expect(bad.status).toBe(400);
    const list = await request(testApp).get('/api/v1/jobs?limit=0').set(auth(alumni.token));
    expect(list.status).toBe(200);
  });
});
