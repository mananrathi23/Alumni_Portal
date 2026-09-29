/**
 * ProtectedRoute.test.jsx — ProtectedRoute component tests
 * Tests that unauthenticated users are redirected to /login
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import axios from 'axios';
import ProtectedRoute from '../src/Components/ProtectedRoute';

vi.mock('../src/main', () => ({ Context: { _currentValue: {} } }));
vi.mock('../src/main.jsx', () => ({ Context: { _currentValue: {} } }));
vi.mock('react', async (i) => {
  const a = await i();
  return { ...a, useContext: () => ({ setIsAuthenticated: vi.fn(), setUser: vi.fn() }) };
});
vi.mock('axios');

const renderRoute = (role) =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole={role}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute Component', () => {

  it('shows loading spinner while verifying session', () => {
    // axios never resolves — stays loading
    axios.get.mockReturnValue(new Promise(() => {}));
    renderRoute('Student');
    expect(screen.getByText(/verifying session/i)).toBeInTheDocument();
  });

  it('redirects to /login when API call fails (unauthenticated)', async () => {
    axios.get.mockRejectedValue(new Error('401'));
    renderRoute('Student');
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders children when API returns correct role', async () => {
    axios.get.mockResolvedValue({ data: { user: { role: 'Student' } } });
    renderRoute('Student');
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('redirects to /login when role does not match allowedRole', async () => {
    axios.get.mockResolvedValue({ data: { user: { role: 'Alumni' } } });
    renderRoute('Student'); // allowed Student, but API says Alumni
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders children when no allowedRole is specified', async () => {
    axios.get.mockResolvedValue({ data: { user: { role: 'Teacher' } } });
    renderRoute(undefined); // no role restriction
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
