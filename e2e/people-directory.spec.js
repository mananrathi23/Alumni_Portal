/**
 * people-directory.spec.js — the directory (student "People Directory", alumni and
 * teacher "Connections") is one shared page with paging and a server-side mentor filter.
 */
const { test, expect } = require('@playwright/test');

const person = (i, extra = {}) => ({ _id: `p${i}`, name: `Person ${i}`, role: 'Alumni', department: 'CSE', ...extra });

async function open(page, role) {
  const user = { _id: 'me', name: 'Me', role, adminVerified: true, department: 'CSE', year: '3rd Year', enrollmentNumber: 'E1',
    designation: 'Professor', employeeId: 'T1', currentCompany: 'Acme', graduationYear: 2020, bio: 'b' };
  const peopleCalls = [];
  const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, ...body }) });
  await page.route('**/api/v1/**', (r) => {
    const url = new URL(r.request().url());
    if (url.pathname.endsWith('/user/me')) return r.fulfill(json({ user }));
    if (url.pathname.endsWith('/people')) {
      peopleCalls.push(Object.fromEntries(url.searchParams));
      const pageNo = Number(url.searchParams.get('page'));
      const list = pageNo === 1 ? [person(1), person(2, { availableForMentorship: true })] : [person(3, { bio: 'Loves teaching' })];
      return r.fulfill(json({ people: list, total: 3, hasMore: pageNo === 1 }));
    }
    return r.fulfill(json({ total: 0, byUser: {}, status: 'none' }));
  });
  await page.addInitScript(() => localStorage.setItem('alumniToken', 'fake'));
  await page.goto(role === 'Student' ? '/student/alumni' : `/${role.toLowerCase()}/students`);
  return peopleCalls;
}

for (const role of ['Student', 'Teacher']) {
  test(`${role} directory pages through results and filters mentors on the server`, async ({ page }) => {
    const calls = await open(page, role);
    await expect(page.getByText('Showing 2 of 3 people')).toBeVisible();

    await page.getByRole('button', { name: 'Load more people' }).click();
    await expect(page.getByText('Person 3')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load more people' })).toHaveCount(0);

    // Profile popup (teachers previously had no popup)
    await page.getByText('Person 3').click();
    await expect(page.getByText('Loves teaching')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);

    await page.getByText('Available for mentorship only').click();
    await expect.poll(() => calls.some((c) => c.mentorOnly === 'true')).toBe(true);
  });
}
