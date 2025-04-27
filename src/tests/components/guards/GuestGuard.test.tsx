import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import GuestGuard from '@/components/guards/GuestGuard';
import React from 'react';

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
}));
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));
vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div>SpinnerMock</div>,
}));

describe('GuestGuard', () => {
  it('renders children if not authenticated', () => {
    render(
      <GuestGuard>
        <div>GuestContent</div>
      </GuestGuard>
    );
    expect(screen.getByText(/GuestContent/)).toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({
        user: null,
        loading: true,
      }),
    }));
    // Re-import after mock
    const GuestGuardReloaded = require('@/components/guards/GuestGuard').default;
    render(
      <GuestGuardReloaded>
        <div>GuestContent</div>
      </GuestGuardReloaded>
    );
    expect(screen.getByText(/SpinnerMock/)).toBeInTheDocument();
  });

  it('redirects to dashboard if authenticated', () => {
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({
        user: { id: 'u1' },
        loading: false,
      }),
    }));
    const GuestGuardReloaded = require('@/components/guards/GuestGuard').default;
    render(
      <GuestGuardReloaded>
        <div>GuestContent</div>
      </GuestGuardReloaded>
    );
    expect(screen.getByText(/Navigate to \/dashboard/)).toBeInTheDocument();
  });
});
