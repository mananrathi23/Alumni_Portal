/**
 * Register.test.jsx — Registration form component tests
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Register from '../src/Components/Authentication/Register';

vi.mock('../src/main', () => ({ Context: { _currentValue: {} } }));
vi.mock('../src/main.jsx', () => ({ Context: { _currentValue: {} } }));
vi.mock('react', async (i) => { const a = await i(); return { ...a, useContext: () => ({ isAuthenticated: false }) }; });
vi.mock('axios');
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (i) => { const a = await i(); return { ...a, useNavigate: () => mockNavigate }; });

const render_ = (role = 'Student') => render(<MemoryRouter><Register selectedRole={role} /></MemoryRouter>);

describe('Register Component', () => {

  it('renders all key fields', () => {
    render_();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
  });

  it('shows Enrollment Year for Student', () => {
    render_('Student');
    expect(screen.getByText('Enrollment Year')).toBeInTheDocument();
  });

  it('shows Enrollment Year for Alumni', () => {
    render_('Alumni');
    expect(screen.getByText('Enrollment Year')).toBeInTheDocument();
  });

  it('does NOT show Enrollment Year for Teacher', () => {
    render_('Teacher');
    expect(screen.queryByText('Enrollment Year')).not.toBeInTheDocument();
  });

  it('shows selected role name in form', () => {
    render_('Alumni');
    expect(screen.getByText('Alumni')).toBeInTheDocument();
  });

  it('shows Sign Up button', () => {
    render_();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows "Name is required" on empty submit', async () => {
    render_();
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(screen.getByText('Name is required')).toBeInTheDocument());
  });

  it('shows "Email is required" after name is filled', async () => {
    render_();
    await userEvent.type(screen.getByPlaceholderText('Enter your name'), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(screen.getByText('Email is required')).toBeInTheDocument());
  });



  it('shows "Password is required" error', async () => {
    render_();
    await userEvent.type(screen.getByPlaceholderText('Enter your name'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Enter your email'), 'test@test.com');

    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(screen.getByText('Password is required')).toBeInTheDocument());
  });

  it('shows mismatch error when passwords differ', async () => {
    render_('Teacher');
    await userEvent.type(screen.getByPlaceholderText('Enter your name'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Enter your email'), 'test@test.com');

    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'Password@123');
    await userEvent.type(screen.getByPlaceholderText('Confirm your password'), 'Different@123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument());
  });

  it('shows min length error for short password', async () => {
    render_('Teacher');
    await userEvent.type(screen.getByPlaceholderText('Enter your name'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Enter your email'), 'test@test.com');

    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    await waitFor(() => expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument());
  });
});
