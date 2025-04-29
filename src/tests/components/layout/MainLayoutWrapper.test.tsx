import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainLayoutWrapper from '@/components/layout/MainLayoutWrapper'; // Adjust path
import React from 'react';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  useLocation: () => ({ pathname: '/some-page' }),
}));
vi.mock('@/components/layout/Footer', () => ({ // Adjust path
  default: () => <footer data-testid="footer">Footer Content</footer>,
}));

describe('MainLayoutWrapper', () => {
  it('renders Outlet and Footer on a regular page', () => {
    render(<MainLayoutWrapper />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders Outlet but hides Footer on /login', () => {
    vi.mock('react-router-dom', () => ({
      Outlet: () => <div data-testid="outlet">Outlet Content</div>,
      useLocation: () => ({ pathname: '/login' }),
    }));
    // Need to re-import or use vi.doMock for changes to take effect in subsequent tests
    const MainLayoutWrapperReloaded = require('@/components/layout/MainLayoutWrapper').default;
    render(<MainLayoutWrapperReloaded />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });

  it('renders Outlet but hides Footer on /register', () => {
    vi.mock('react-router-dom', () => ({
      Outlet: () => <div data-testid="outlet">Outlet Content</div>,
      useLocation: () => ({ pathname: '/register' }),
    }));
    const MainLayoutWrapperReloaded = require('@/components/layout/MainLayoutWrapper').default;
    render(<MainLayoutWrapperReloaded />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
  });
});
