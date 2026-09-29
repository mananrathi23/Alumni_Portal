/**
 * smoke-all-pages.spec.js — opens every page of every role with mocked (empty)
 * API data and fails on any uncaught error, React error, or blank page.
 */
const { test, expect } = require('@playwright/test');
const ROUTES = {
  Student: ['dashboard','forum','alumni','jobs','events','messages','requests','profile','mentorship','batchmates','incubation'],
  Teacher: ['dashboard','forum','students','jobs','events','messages','mentorship','profile','batchmates','incubation'],
  Alumni:  ['dashboard','forum','students','jobs','events','messages','mentorship','profile','batchmates','incubation'],
  Admin:   ['dashboard','news','events','jobs','students','users','support'],
};
const EMPTY = { success: true, total: 0, count: 0, page: 1, pages: 0, hasMore: false,
  users: [], jobs: [], events: [], questions: [], ideas: [], conversations: [], people: [], batches: [], members: [],
  mentors: [], requests: [], connections: [], incoming: [], outgoing: [], news: [], announcements: [], tickets: [],
  students: [], messages: [], ratedSessions: [], filters: { departments: [], years: [], classes: [] },
  settings: { availableForMentorship: false, mentorshipSlots: [], weeklyLimit: 5 }, stats: {}, unread: {}, byUser: {},
  linked: false, weeklyCount: 0, weeklyLimit: 5 };
for (const [role, pages] of Object.entries(ROUTES)) {
  test(`every ${role} page renders without errors`, async ({ page }) => {
    const user = { _id: 'u1', name: `Test ${role}`, email: 'x@test.com', role, adminVerified: true,
      department: 'Computer Science', year: '3rd Year', enrollmentNumber: 'EN1', bio: 'bio', designation: 'Professor',
      employeeId: 'E1', currentCompany: 'Acme', graduationYear: 2020, skills: [], mentorStats: {},
      permissions: { manageUsers: true, manageEvents: true, manageJobs: true, manageForum: true, manageNews: true, manageAnnouncements: true, viewStudents: true } };
    await page.route('**/api/v1/**', (r) => {
      const url = r.request().url();
      const body = url.includes('/user/me') ? { success: true, user } : EMPTY;
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.addInitScript(() => localStorage.setItem('alumniToken', 'fake'));
    const problems = [];
    page.on('pageerror', (e) => problems.push(`PAGEERROR ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|socket\.io|net::ERR|Failed to load resource/i.test(m.text())) problems.push(`CONSOLE ${m.text().slice(0, 200)}`); });
    let visited = 0;
    for (const p of pages) { visited++;
      const before = problems.length;
      await page.goto(`/${role.toLowerCase()}/${p}`);
      await page.waitForTimeout(700);
      const blank = await page.evaluate(() => document.body.innerText.trim().length < 20);
      if (blank) problems.push(`BLANK /${role.toLowerCase()}/${p}`);
      for (const pr of problems.slice(before)) console.log(`[${role}/${p}] ${pr}`);
    }
    expect(visited).toBe(pages.length);
    expect(problems).toEqual([]);
  });
}
