/**
 * auth-flow.spec.js — End-to-End tests for Alumni Portal authentication
 *
 * Tests run against the LIVE deployed Vercel app.
 * URL: https://alumni-portal-gamma-eosin.vercel.app/login
 *
 * Page structure:
 *  - Left panel: "Your campus network, extended for life."
 *  - Right panel:
 *    • "Continue with Google" and "Continue with LinkedIn" buttons
 *    • "Sign In" / "Sign Up" tabs
 *    • "SELECT YOUR ROLE": Student, Alumni, Teacher, Admin cards
 *    • Email ("Enter your email") and Password ("Enter your password") inputs
 *    • "Keep me signed in" checkbox + "Forgot Password?" link
 *    • "SIGN IN" submit button
 */

const { test, expect } = require('@playwright/test');

const LOGIN_URL = 'https://alumni-portal-gamma-eosin.vercel.app/login';
const PAGE_TIMEOUT = 20000;

test.describe('Alumni Portal — Authentication Flow', () => {

  test('Login page loads and shows "Welcome back" heading', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: PAGE_TIMEOUT });
  });

  test('All four role cards are visible: Student, Alumni, Teacher, Admin', async ({ page }) => {
    await page.goto(LOGIN_URL);
    // Role cards are in the SELECT YOUR ROLE section — scope to that section
    await expect(page.getByText('SELECT YOUR ROLE')).toBeVisible({ timeout: PAGE_TIMEOUT });
    // Each role text appears inside a card button in the role grid
    const roleGrid = page.locator('text=SELECT YOUR ROLE').locator('..');
    await expect(roleGrid.getByText('Student')).toBeVisible({ timeout: PAGE_TIMEOUT });
    await expect(roleGrid.getByText('Alumni')).toBeVisible({ timeout: PAGE_TIMEOUT });
    await expect(roleGrid.getByText('Teacher')).toBeVisible({ timeout: PAGE_TIMEOUT });
    await expect(roleGrid.getByText('Admin')).toBeVisible({ timeout: PAGE_TIMEOUT });
  });

  test('"Sign In" and "Sign Up" tabs are visible', async ({ page }) => {
    await page.goto(LOGIN_URL);
    // Two "Sign In" buttons exist (tab + submit). The tab is the first one.
    await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible({ timeout: PAGE_TIMEOUT });
    await expect(page.getByText('Sign Up')).toBeVisible({ timeout: PAGE_TIMEOUT });
  });

  test('Email and Password input fields are visible on load', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible({ timeout: PAGE_TIMEOUT });
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible({ timeout: PAGE_TIMEOUT });
  });

  test('"Forgot Password?" link is visible', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.getByText('Forgot Password?')).toBeVisible({ timeout: PAGE_TIMEOUT });
  });

  test('"Keep me signed in" checkbox text is visible', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.getByText('Keep me signed in')).toBeVisible({ timeout: PAGE_TIMEOUT });
  });

  test('Submitting empty form shows "Email is required" validation error', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back', { timeout: PAGE_TIMEOUT });
    // The submit button is inside the <form> — use form-scoped selector to avoid matching the tab
    await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email is required')).toBeVisible({ timeout: 8000 });
  });

  test('Submitting with email only shows "Password is required"', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back', { timeout: PAGE_TIMEOUT });
    await page.getByPlaceholder('Enter your email').fill('test@test.com');
    await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Password is required')).toBeVisible({ timeout: 8000 });
  });

  test('Login with wrong credentials shows an error from the server', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back', { timeout: PAGE_TIMEOUT });
    await page.getByPlaceholder('Enter your email').fill('fake@notexist.com');
    await page.getByPlaceholder('Enter your password').fill('WrongPassword@123');
    await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
    // API returns "Invalid email or Password."
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 20000 });
  });

  test('Clicking Alumni role card switches selection without hiding the form', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back', { timeout: PAGE_TIMEOUT });
    // Alumni card in the role grid
    await page.locator('text=Alumni').first().click();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible({ timeout: 5000 });
  });

  test('Clicking Sign Up tab shows registration form with Name field', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.waitForSelector('text=Welcome back', { timeout: PAGE_TIMEOUT });
    await page.getByText('Sign Up').click();
    // Registration form shows "Enter your name" placeholder (confirmed from live app)
    await expect(page.getByPlaceholder('Enter your name')).toBeVisible({ timeout: PAGE_TIMEOUT });
  });

  test('"Continue with Google" OAuth button is visible', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.getByText('Continue with Google')).toBeVisible({ timeout: PAGE_TIMEOUT });
  });

  test('"Continue with LinkedIn" OAuth button is visible', async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.getByText('Continue with LinkedIn')).toBeVisible({ timeout: PAGE_TIMEOUT });
  });
});
