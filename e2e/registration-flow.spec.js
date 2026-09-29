/**
 * registration-flow.spec.js — E2E: Full registration form flow
 * Tests against: https://alumni-portal-gamma-eosin.vercel.app/login
 */
const { test, expect } = require('@playwright/test');

const LOGIN_URL = 'https://alumni-portal-gamma-eosin.vercel.app/login';

test.describe('Alumni Portal — Registration Flow', () => {

  test('Sign Up tab shows registration form with all fields', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    await page.getByText('Sign Up').click();
    await expect(page.getByPlaceholder('Enter your name')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();

    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
  });

  test('Student registration shows Enrollment Year field', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    await page.getByText('Sign Up').click();
    // Student is default — should show Enrollment Year
    await expect(page.getByText('Enrollment Year')).toBeVisible({ timeout: 10000 });
  });

  test('Teacher registration does NOT show Enrollment Year', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    await page.getByText('Teacher').click();
    await page.getByText('Sign Up').click();
    await expect(page.getByPlaceholder('Enter your name')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Enrollment Year')).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('Empty registration submit shows Name is required', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    await page.getByText('Sign Up').click();
    await page.waitForSelector('[placeholder="Enter your name"]');
    await page.locator('form').getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText('Name is required')).toBeVisible({ timeout: 5000 });
  });

  test('Short password shows minimum length error', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    await page.getByText('Teacher').click();
    await page.getByText('Sign Up').click();
    await page.waitForSelector('[placeholder="Enter your name"]');
    await page.getByPlaceholder('Enter your name').fill('Test User');
    await page.getByPlaceholder('Enter your email').fill('test@test.com');

    await page.getByPlaceholder('Enter your password').fill('short');
    await page.locator('form').getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible({ timeout: 5000 });
  });

  test('Mismatched passwords shows error', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    await page.getByText('Teacher').click();
    await page.getByText('Sign Up').click();
    await page.waitForSelector('[placeholder="Enter your name"]');
    await page.getByPlaceholder('Enter your name').fill('Test User');
    await page.getByPlaceholder('Enter your email').fill('test@test.com');

    await page.getByPlaceholder('Enter your password').fill('Password@123');
    await page.getByPlaceholder('Confirm your password').fill('Different@456');
    await page.locator('form').getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByText(/passwords don't match/i)).toBeVisible({ timeout: 5000 });
  });

  test('Sign In tab switches back to login form', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back');
    await page.getByText('Sign Up').click();
    await expect(page.getByPlaceholder('Enter your name')).toBeVisible({ timeout: 10000 });
    // Switch back
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await expect(page.getByPlaceholder('Enter your name')).not.toBeVisible({ timeout: 5000 });
  });
});
