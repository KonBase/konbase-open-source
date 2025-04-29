import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainLayout from '@/components/layout/MainLayout'; // Adjust path
import React from 'react';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }), // Default path
}));
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({
    user: { id: 'user1' }, // Default: authenticated user
    loading: false,
  }),
}));
vi.mock('@/components/layout/Header', () => ({ // Adjust path
  Header: () => <header data-testid="header">Header Content</header>,
}));
vi.mock('@/components/layout/DashboardFooter', () => ({ // Adjust path
  default: () => <footer data-testid="dashboard-footer">Dashboard Footer</footer>,
}));

describe('MainLayout', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Reset mocks for useAuth if needed between tests
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({ user: { id: 'user1' }, loading: false }),
    }));
  });

  it('renders Header, Outlet, and DashboardFooter for authenticated user on dashboard', () => {
    render(<MainLayout />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-footer')).toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({ user: null, loading: true }),
    }));
    const MainLayoutReloaded = require('@/components/layout/MainLayout').default;
    render(<MainLayoutReloaded />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // Assuming spinner has role progressbar
    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user to /login for protected route', () => {
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({ user: null, loading: false }),
    }));
    // Mock location to be a protected route
    vi.doMock('react-router-dom', () => ({
      Outlet: () => <div data-testid="outlet">Outlet Content</div>,
      useNavigate: () => mockNavigate,
      useLocation: () => ({ pathname: '/some-protected-page' }),
    }));
    const MainLayoutReloaded = require('@/components/layout/MainLayout').default;
    render(<MainLayoutReloaded />);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('does NOT redirect unauthenticated user on public route (/login)', () => {
    vi.doMock('@/contexts/auth', () => ({
      useAuth: () => ({ user: null, loading: false }),
    }));
    vi.doMock('react-router-dom', () => ({
      Outlet: () => <div data-testid="outlet">Outlet Content</div>,
      useNavigate: () => mockNavigate,
      useLocation: () => ({ pathname: '/login' }),
    }));
    const MainLayoutReloaded = require('@/components/layout/MainLayout').default;
    render(<MainLayoutReloaded />);
    expect(mockNavigate).not.toHaveBeenCalled();
    // Should still render layout parts for public pages if designed that way
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

   it('hides Header on /profile page', () => {
     vi.doMock('react-router-dom', () => ({
       Outlet: () => <div data-testid="outlet">Outlet Content</div>,
       useNavigate: () => mockNavigate,
       useLocation: () => ({ pathname: '/profile' }),
     }));
     const MainLayoutReloaded = require('@/components/layout/MainLayout').default;
     render(<MainLayoutReloaded />);
     expect(screen.queryByTestId('header')).not.toBeInTheDocument();
     expect(screen.getByTestId('outlet')).toBeInTheDocument();
     expect(screen.getByTestId('dashboard-footer')).toBeInTheDocument();
   });

   it('hides Header on /settings page', () => {
     vi.doMock('react-router-dom', () => ({
       Outlet: () => <div data-testid="outlet">Outlet Content</div>,
       useNavigate: () => mockNavigate,
       useLocation: () => ({ pathname: '/settings/account' }), // Example settings path
     }));
     const MainLayoutReloaded = require('@/components/layout/MainLayout').default;
     render(<MainLayoutReloaded />);
     expect(screen.queryByTestId('header')).not.toBeInTheDocument();
     expect(screen.getByTestId('outlet')).toBeInTheDocument();
     expect(screen.getByTestId('dashboard-footer')).toBeInTheDocument();
   });
});
