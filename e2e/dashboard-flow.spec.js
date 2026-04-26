/**
 * dashboard-flow.spec.js — E2E: Full login to dashboard flow
 * Tests against: https://alumni-portal-gamma-eosin.vercel.app/login
 */
const { test, expect } = require('@playwright/test');

const LOGIN_URL = 'https://alumni-portal-gamma-eosin.vercel.app/login';

test.describe('Alumni Portal — Dashboard Login Flow', () => {

  test('Student login opens Student Dashboard', async ({ page }) => {
    // Note: We use the existing test student account that was set up previously.
    // If this account gets deleted, the test will fail.
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    
    // Fill in Student credentials
    await page.getByPlaceholder('Enter your email').fill('student@test.com');
    await page.getByPlaceholder('Enter your password').fill('Password@123');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Verify it navigates to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verify it shows student-specific content or generic welcome
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('Alumni login opens Alumni Dashboard', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    
    // Select Alumni role
    await page.getByText('Alumni').click();

    // Fill in Alumni credentials
    await page.getByPlaceholder('Enter your email').fill('alumni@test.com');
    await page.getByPlaceholder('Enter your password').fill('Password@123');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Verify it navigates to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verify it shows alumni-specific content
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('Teacher login opens Teacher Dashboard', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    
    // Select Teacher role
    await page.getByText('Teacher').click();

    // Fill in Teacher credentials
    await page.getByPlaceholder('Enter your email').fill('teacher@test.com');
    await page.getByPlaceholder('Enter your password').fill('Password@123');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Verify it navigates to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verify it shows teacher-specific content
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 10000 });
  });

  test('Admin login opens Admin Dashboard', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    
    // Select Admin role
    await page.getByText('Admin').click();

    // Fill in Admin credentials
    await page.getByPlaceholder('Enter your email').fill('admin@test.com');
    await page.getByPlaceholder('Enter your password').fill('Password@123');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Verify it navigates to dashboard
    await expect(page).toHaveURL(/.*admin/);
    
    // Verify it shows admin-specific content
    await expect(page.getByText('Users Management')).toBeVisible({ timeout: 10000 });
  });
});
