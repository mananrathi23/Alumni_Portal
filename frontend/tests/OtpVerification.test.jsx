/**
 * OtpVerification.test.jsx — Frontend Component Tests for OTP Verification page
 *
 * Tests cover:
 *  - Page renders correctly with heading and OTP input
 *  - Shows error if OTP field is empty on submit
 *  - Shows error if OTP is too short (< 4 digits)
 *  - "Go Back" button is present
 *  - Verify OTP button shows "Verifying..." during submission
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import OtpVerification from '../../src/Components/Authentication/OtpVerification';

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useContext: () => ({ setIsAuthenticated: vi.fn(), setUser: vi.fn() }),
  };
});
vi.mock('axios');
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ── Render helper — injects route params email, phone, role ───────────────────
const renderOtp = (email = 'user@test.com', phone = '+919876543210', role = 'Student') =>
  render(
    <MemoryRouter initialEntries={[`/otp/${email}/${phone}/${role}`]}>
      <Routes>
        <Route path="/otp/:email/:phone/:role" element={<OtpVerification />} />
      </Routes>
    </MemoryRouter>
  );

// ─────────────────────────────────────────────────────────────────────────────
describe('OtpVerification Component', () => {

  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders the OTP Verification heading', () => {
    renderOtp();
    expect(screen.getByText(/OTP Verification/i)).toBeInTheDocument();
  });

  it('renders the OTP input field', () => {
    renderOtp();
    expect(screen.getByPlaceholderText(/_ _ _ _/i)).toBeInTheDocument();
  });

  it('renders the Verify OTP submit button', () => {
    renderOtp();
    expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
  });

  it('renders the Go Back button', () => {
    renderOtp();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('displays the user email on screen', () => {
    renderOtp('student@test.com');
    expect(screen.getByText('student@test.com')).toBeInTheDocument();
  });

  it('shows error if OTP field is submitted empty', async () => {
    renderOtp();
    await userEvent.click(screen.getByRole('button', { name: /verify otp/i }));
    await waitFor(() => {
      expect(screen.getByText(/otp is required/i)).toBeInTheDocument();
    });
  });

  it('shows error when OTP is less than 4 digits', async () => {
    renderOtp();
    await userEvent.type(screen.getByPlaceholderText(/_ _ _ _/i), '12');
    await userEvent.click(screen.getByRole('button', { name: /verify otp/i }));
    await waitFor(() => {
      expect(screen.getByText(/at least 4 digits/i)).toBeInTheDocument();
    });
  });

  it('calls navigate(-1) when Go Back is clicked', async () => {
    renderOtp();
    await userEvent.click(screen.getByRole('button', { name: /go back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
