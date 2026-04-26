/**
 * dashboard-flow.spec.js — E2E: Full login to dashboard flow
 * Tests against: https://alumni-portal-gamma-eosin.vercel.app/login
 * Uses mocked API responses to ensure test stability and isolate frontend routing logic.
 */
const { test, expect } = require('@playwright/test');

const LOGIN_URL = 'https://alumni-portal-gamma-eosin.vercel.app/login';

// Helper to mock the login API response
async function mockLoginAPI(page, role) {
  await page.route('**/api/v1/user/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        token: 'fake-jwt-token-12345',
        user: {
          _id: 'fake-id',
          name: `Test ${role}`,
          email: `${role.toLowerCase()}@test.com`,
          role: role
        }
      })
    });
  });
}

test.describe('Alumni Portal — Dashboard Login Flow', () => {

  test('Student login opens Student Dashboard', async ({ page }) => {
    await mockLoginAPI(page, 'Student');
    
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    
    // Fill in Student credentials
    await page.getByPlaceholder('Enter your email').fill('student@test.com');
    await page.getByPlaceholder('Enter your password').fill('Password@123');
    await page.locator('form').getByRole('button', { name: /^sign in$/i }).click();

    // Verify it navigates to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Alumni login opens Alumni Dashboard', async ({ page }) => {
    await mockLoginAPI(page, 'Alumni');

    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    
    // Select Alumni role
    await page.locator('span').filter({ hasText: /^Alumni$/ }).click();

    // Fill in Alumni credentials
    await page.getByPlaceholder('Enter your email').fill('alumni@test.com');
    await page.getByPlaceholder('Enter your password').fill('Password@123');
    await page.locator('form').getByRole('button', { name: /^sign in$/i }).click();

    // Verify it navigates to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Teacher login opens Teacher Dashboard', async ({ page }) => {
    await mockLoginAPI(page, 'Teacher');

    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    
    // Select Teacher role
    await page.locator('span').filter({ hasText: /^Teacher$/ }).click();

    // Fill in Teacher credentials
    await page.getByPlaceholder('Enter your email').fill('teacher@test.com');
    await page.getByPlaceholder('Enter your password').fill('Password@123');
    await page.locator('form').getByRole('button', { name: /^sign in$/i }).click();

    // Verify it navigates to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Admin login opens Admin Dashboard', async ({ page }) => {
    await mockLoginAPI(page, 'Admin');

    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    
    // Select Admin role
    await page.locator('span').filter({ hasText: /^Admin$/ }).click();

    // Fill in Admin credentials
    await page.getByPlaceholder('Enter your email').fill('admin@test.com');
    await page.getByPlaceholder('Enter your password').fill('Password@123');
    await page.locator('form').getByRole('button', { name: /^sign in$/i }).click();

    // Verify it navigates to dashboard
    await expect(page).toHaveURL(/.*admin/);
  });
});
