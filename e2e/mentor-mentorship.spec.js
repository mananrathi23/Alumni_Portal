/**
 * mentor-mentorship.spec.js — the mentor side of mentorship is one shared page
 * (SharedMentorship) for Alumni and Teachers; check both roles render it with
 * their own colour and routes. API responses are mocked.
 */
const { test, expect } = require('@playwright/test');

const request = (id, status, extra = {}) => ({
  _id: id, status, goal: 'career', createdAt: '2026-09-20T10:00:00.000Z',
  slot: { day: 'Mon', time: '10:00 AM' },
  student: { id: 's1', name: `Student ${id}`, year: '3rd Year', department: 'CSE' },
  ...extra,
});

async function openAs(page, role) {
  const user = {
    _id: 'm1', name: `Test ${role}`, email: 'm@test.com', role, adminVerified: true,
    department: 'CSE', designation: 'Professor', employeeId: 'E1', currentCompany: 'Acme', graduationYear: 2020, bio: 'bio',
  };
  const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, ...body }) });
  await page.route('**/api/v1/**', (r) => {
    const url = r.request().url();
    if (url.includes('/user/me')) return r.fulfill(json({ user }));
    if (url.includes('/mentorship/requests')) return r.fulfill(json({ requests: [
      request('r1', 'Pending', { note: 'Please help with interviews' }),
      request('r2', 'Accepted', { meetingLink: 'https://meet.example/abc', slot: { day: 'Tue', time: '2:00 PM' } }),
      request('r3', 'Completed', { rating: { value: 5, feedback: 'Great session' }, completedAt: '2026-09-25T10:00:00.000Z' }),
    ] }));
    if (url.includes('/mentorship/my-stats')) return r.fulfill(json({ weeklyCount: 1, weeklyLimit: 5, stats: { averageRating: 5, totalRatings: 1, totalSessions: 1, acceptanceRate: 100, score: 3.2 } }));
    if (url.includes('/mentorship/settings')) return r.fulfill(json({ settings: { availableForMentorship: true, weeklyLimit: 5, mentorshipSlots: [{ day: 'Mon', time: '10:00 AM', booked: false }] } }));
    if (url.includes('/mentorship/auth/status')) return r.fulfill(json({ linked: false }));
    return r.fulfill(json({ total: 0, byUser: {}, count: 0 }));
  });
  await page.addInitScript(() => localStorage.setItem('alumniToken', 'fake'));
  await page.goto(`/${role.toLowerCase()}/mentorship`);
}

for (const [role, color] of [['Alumni', 'emerald'], ['Teacher', 'violet']]) {
  test(`${role} mentor page shows requests, stats, settings and history in ${color}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await openAs(page, role);

    await expect(page.getByText('Student r1')).toBeVisible();
    await expect(page.getByText('"Please help with interviews"')).toBeVisible();
    await expect(page.getByRole('button', { name: /Accept & Book Slot/ })).toHaveClass(new RegExp(`bg-${color}-500`));
    await expect(page.getByText('Accept Rate')).toBeVisible();
    await expect(page.getByText('100%')).toBeVisible();

    // Open Chat goes to this role's messages page
    await page.getByRole('button', { name: /Open Chat/ }).click();
    await expect(page).toHaveURL(new RegExp(`/${role.toLowerCase()}/messages\\?session=r2`));
    await page.goBack();

    await page.getByRole('button', { name: /My Settings/ }).click();
    await expect(page.getByText('Weekly Session Limit')).toBeVisible();
    await expect(page.getByText('Mon · 10:00 AM')).toBeVisible();

    await page.getByRole('button', { name: /History/ }).click();
    await expect(page.getByText('"Great session"')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
