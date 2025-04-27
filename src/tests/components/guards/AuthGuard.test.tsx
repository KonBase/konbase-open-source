import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AuthGuard from '@/components/guards/AuthGuard';
import React from 'react';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/protected' }),
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
}));
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({
    user: { id: 'u1' },
    userProfile: { role: 'admin' },
    loading: false,
  }),
}));
vi.mock('@/types/user', () => ({
  UserRoleType: {},
}));
vi.mock('@/contexts/auth/AuthUtils', () => ({
  checkUserHasRole: (profile: any, role: string) => profile.role === role,
}));
vi.mock('@/utils/debug', () => ({
  logDebug: vi.fn(),
}));
vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div>SpinnerMock</div>,
}));

describe('AuthGuard', () => {
  it('renders children if authenticated and has required role', () => {
    render(
      <AuthGuard requiredRoles={['admin']}>
        <div>ProtectedContent</div>
      </AuthGuard>
    );
    expect(screen.getByText(/ProtectedContent/)).toBeInTheDocument();
  });

  it('redirects to dashboard if role is insufficient', () => {
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({
        user: { id: 'u1' },
        userProfile: { role: 'user' },
        loading: false,
      }),
    }));
    const AuthGuardReloaded = require('@/components/guards/AuthGuard').default;
    render(
      <AuthGuardReloaded requiredRoles={['admin']}>
        <div>ProtectedContent</div>
      </AuthGuardReloaded>
    );
    expect(screen.getByText(/Navigate to \/dashboard/)).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', () => {
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({
        user: null,
        userProfile: null,
        loading: false,
      }),
    }));
    const AuthGuardReloaded = require('@/components/guards/AuthGuard').default;
    render(
      <AuthGuardReloaded requiredRoles={['admin']}>
        <div>ProtectedContent</div>
      </AuthGuardReloaded>
    );
    expect(screen.getByText(/Navigate to \/login/)).toBeInTheDocument();
  });

  it('shows spinner while loading', () => {
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({
        user: null,
        userProfile: null,
        loading: true,
      }),
    }));
    const AuthGuardReloaded = require('@/components/guards/AuthGuard').default;
    render(
      <AuthGuardReloaded requiredRoles={['admin']}>
        <div>ProtectedContent</div>
      </AuthGuardReloaded>
    );
    expect(screen.getByText(/SpinnerMock/)).toBeInTheDocument();
  });
});
