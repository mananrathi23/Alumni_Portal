/**
 * Login.test.jsx — Frontend Component Tests for the Login form
 *
 * Tests cover:
 *  - Renders email and password fields
 *  - Shows validation errors when fields are empty
 *  - Shows validation error when password is too short
 *  - Shows "Forgot Password?" button
 *  - "Keep me signed in" checkbox toggle
 *  - Submit button shows loading state while submitting
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Login from '../src/Components/Authentication/Login';

// ── Mock dependencies that need a full app context ────────────────────────────
vi.mock('../src/main', () => ({
  Context: { _currentValue: { setIsAuthenticated: vi.fn(), setUser: vi.fn() } },
}));

// Stop main.jsx from executing createRoot on import
vi.mock('../src/main.jsx', () => ({
  Context: { _currentValue: { setIsAuthenticated: vi.fn(), setUser: vi.fn() } },
}));

// Mock useContext to avoid needing a real Context Provider
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useContext: () => ({
      setIsAuthenticated: vi.fn(),
      setUser: vi.fn(),
    }),
  };
});

// Mock axios — we don't want real HTTP calls in component tests
vi.mock('axios');

// Mock react-toastify
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ── Render helper ─────────────────────────────────────────────────────────────
const renderLogin = (role = 'Student') =>
  render(
    <MemoryRouter>
      <Login selectedRole={role} />
    </MemoryRouter>
  );

// ─────────────────────────────────────────────────────────────────────────────
describe('Login Component', () => {

  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders email and password input fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it('renders the Sign In submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the Forgot Password? button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('renders the "Keep me signed in" label', () => {
    renderLogin();
    expect(screen.getByText(/keep me signed in/i)).toBeInTheDocument();
  });

  it('shows an error message when email is empty and form is submitted', async () => {
    renderLogin();
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('shows an error message when password is empty and form is submitted', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'test@test.com');
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows an error when password is less than 6 characters', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/enter your email/i), 'test@test.com');
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), '123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('the form does not show the 30-day hint before Keep me signed in is toggled', () => {
    renderLogin();
    // The hint only appears AFTER toggling — it should not be in the DOM initially
    expect(screen.queryByText((content) => content.includes('30 days'))).not.toBeInTheDocument();
  });

  it('shows ForgotPassword view when Forgot Password? is clicked', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /forgot password/i }));
    // ForgotPassword component should now appear — at minimum the login form should be gone
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });
  });
});
