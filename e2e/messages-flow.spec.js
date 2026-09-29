/**
 * messages-flow.spec.js — E2E: one conversation per person.
 * Connection chat and mentorship sessions with the same person appear as a
 * single thread. API responses are mocked (no backend needed).
 */
const { test, expect } = require('@playwright/test');

// A complete profile, so the "complete your profile" prompt doesn't cover the page
const me = {
  _id: 'me-id', name: 'Test Student', email: 'student@test.com', role: 'Student', adminVerified: true,
  department: 'Computer Science', year: '3rd Year', enrollmentNumber: 'EN001', bio: 'Test bio',
};

const conversations = [
  {
    key: 'me-id_mentor-id',
    userId: 'mentor-id',
    user: { _id: 'mentor-id', name: 'Priya Mentor', role: 'Alumni' },
    connectionId: 'conn-1',
    connectedAt: '2026-09-01T10:00:00.000Z',
    mentorships: [
      { _id: 'session-1', goal: 'career', slot: { day: 'Mon', time: '10:00' }, status: 'Accepted', meetingLink: 'https://meet.example/abc', iAmMentor: false },
      { _id: 'session-0', goal: 'resume', slot: { day: 'Fri', time: '16:00' }, status: 'Completed', iAmMentor: false },
    ],
    canSend: true,
    readOnlyReason: null,
    isBlocked: false,
    lastMessage: { text: 'See you Monday!', senderId: 'mentor-id', createdAt: '2026-09-28T09:00:00.000Z' },
    unread: 2,
  },
  {
    key: 'me-id_teacher-id',
    userId: 'teacher-id',
    user: { _id: 'teacher-id', name: 'Ravi Teacher', role: 'Teacher' },
    connectionId: null,
    connectedAt: null,
    mentorships: [{ _id: 'session-2', goal: 'technical', slot: { day: 'Tue', time: '11:00' }, status: 'Completed', iAmMentor: false }],
    canSend: false,
    readOnlyReason: 'Your mentorship session has ended. Send a connection request to keep chatting.',
    isBlocked: false,
    lastMessage: { text: 'Thanks for the session', senderId: 'me-id', createdAt: '2026-09-20T09:00:00.000Z' },
    unread: 0,
  },
];

const thread = [
  { _id: 'm1', conversationKey: 'me-id_mentor-id', sender: { id: 'me-id', name: 'Test Student', role: 'Student' }, text: 'Hi, we connected at the meetup', createdAt: '2026-09-27T09:00:00.000Z' },
  { _id: 'm2', conversationKey: 'me-id_mentor-id', mentorshipId: 'session-1', meetingLink: 'https://meet.example/abc', sender: { id: 'mentor-id', name: 'Priya Mentor', role: 'Alumni' }, text: '🎉 Session confirmed! Here is your meeting link:\nhttps://meet.example/abc', createdAt: '2026-09-28T08:00:00.000Z' },
  { _id: 'm3', conversationKey: 'me-id_mentor-id', sender: { id: 'mentor-id', name: 'Priya Mentor', role: 'Alumni' }, text: 'See you Monday!', createdAt: '2026-09-28T09:00:00.000Z' },
];

async function mockApi(page) {
  const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/v1/user/me', (r) => r.fulfill(json({ success: true, user: me })));
  await page.route('**/api/v1/conversations', (r) => r.fulfill(json({ success: true, conversations })));
  await page.route('**/api/v1/conversations/unread', (r) => r.fulfill(json({ success: true, total: 2, byUser: { 'mentor-id': 2 } })));
  await page.route('**/api/v1/conversations/mentor-id/messages**', (r) => r.fulfill(json({ success: true, messages: thread, hasMore: false })));
  await page.route('**/api/v1/conversations/teacher-id/messages**', (r) => r.fulfill(json({ success: true, messages: [], hasMore: false })));
  await page.addInitScript(() => localStorage.setItem('alumniToken', 'fake-jwt'));
}

test.describe('Messages — one conversation per person', () => {
  test('shows one row per person with the latest message and unread count', async ({ page }) => {
    await mockApi(page);
    await page.goto('/student/messages');

    const rows = page.locator('button', { hasText: 'Priya Mentor' });
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('See you Monday!');
    await expect(rows.first()).toContainText('Active mentorship');
    await expect(rows.first()).toContainText('2');
    await expect(page.locator('button', { hasText: 'Ravi Teacher' })).toContainText('You: Thanks for the session');
    // No separate Mentorship / Connections tabs any more
    await expect(page.getByRole('button', { name: /^Connections/ })).toHaveCount(0);
  });

  test('connection chat and mentorship messages share one thread', async ({ page }) => {
    await mockApi(page);
    await page.goto('/student/messages');
    await page.locator('button', { hasText: 'Priya Mentor' }).click();

    await expect(page.getByText('Connected', { exact: true })).toBeVisible();
    await expect(page.getByText('Mentorship · Career Guidance · Mon 10:00')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Join' })).toHaveAttribute('href', 'https://meet.example/abc');
    await expect(page.getByText('1 past mentorship session')).toBeVisible();

    await expect(page.getByText('Hi, we connected at the meetup')).toBeVisible();
    await expect(page.getByRole('link', { name: 'https://meet.example/abc' })).toBeVisible();
    await expect(page.getByPlaceholder(/Type a message/)).toBeEnabled();
  });

  test('a deep link to a mentorship session opens the person’s conversation', async ({ page }) => {
    await mockApi(page);
    await page.goto('/student/messages?session=session-1');
    await expect(page.getByText('Mentorship · Career Guidance · Mon 10:00')).toBeVisible();
  });

  test('a finished mentorship without a connection is read-only', async ({ page }) => {
    await mockApi(page);
    await page.goto('/student/messages');
    await page.locator('button', { hasText: 'Ravi Teacher' }).click();

    await expect(page.getByText(/session has ended\. Send a connection request/)).toBeVisible();
    await expect(page.getByPlaceholder(/Type a message/)).toHaveCount(0);
  });
});
