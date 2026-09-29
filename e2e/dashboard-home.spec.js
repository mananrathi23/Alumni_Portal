/**
 * dashboard-home.spec.js — Alumni and Teacher dashboards are one shared page
 * (SharedDashboardHome). Checks stats come from server totals and feeds render.
 */
const { test, expect } = require('@playwright/test');

for (const role of ['Alumni', 'Teacher']) {
  test(`${role} dashboard shows totals and feeds`, async ({ page }) => {
    const user = { _id: 'u1', name: `Test ${role}`, role, adminVerified: true, department: 'CSE', designation: 'Professor',
      employeeId: 'E1', currentCompany: 'Acme', currentDesignation: 'Engineer', graduationYear: 2020, enrollmentYear: 2016, bio: 'b' };
    const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, ...body }) });
    await page.route('**/api/v1/**', (r) => {
      const url = r.request().url();
      if (url.includes('/user/me')) return r.fulfill(json({ user }));
      if (url.includes('/jobs')) return r.fulfill(json({ total: 42, jobs: [{ _id: 'j1', role: 'Backend Intern', company: 'Acme' }] }));
      if (url.includes('/forum/questions')) return r.fulfill(json({ total: 7, questions: [{ _id: 'q1', title: 'How to prep?', author: { name: 'Riya' }, answerCount: 3 }] }));
      if (url.includes('/events')) return r.fulfill(json({ total: 2, events: [{ _id: 'e1', title: 'Alumni Meet', date: '2026-10-10T00:00:00Z' }] }));
      if (url.includes('/incubation')) return r.fulfill(json({ total: 1, ideas: [{ _id: 'i1', title: 'Campus App', stage: 'mvp', authorName: 'Dev', upvotes: ['a'] }] }));
      if (url.includes('/mentorship/requests')) return r.fulfill(json({ count: 4 }));
      return r.fulfill(json({ total: 0, byUser: {} }));
    });
    await page.addInitScript(() => localStorage.setItem('alumniToken', 'fake'));
    await page.goto(`/${role.toLowerCase()}/dashboard`);

    await expect(page.getByText(`${role} Dashboard`)).toBeVisible();
    // Stat cards show server totals (42 jobs), not the one item loaded for the feed
    const card = (label) => page.getByText(label, { exact: true }).locator('..');
    await expect(card('Open Positions')).toContainText('42');
    await expect(card('Mentee Requests')).toContainText('4');
    await expect(page.getByText('Riya · 3 answers')).toBeVisible();
    await expect(page.getByText('Campus App')).toBeVisible();
    await page.getByText('Campus App').click();
    await expect(page).toHaveURL(new RegExp(`/${role.toLowerCase()}/incubation`));
  });
}
