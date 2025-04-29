import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/layout/Header'; // Adjust path
import React from 'react';

// Mock dependencies
const mockNavigate = vi.fn();
const mockHistoryBack = vi.fn();
Object.defineProperty(window, 'history', {
  value: {
    back: mockHistoryBack,
  },
  writable: true,
});

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/dashboard' }), // Default path
  useNavigate: () => mockNavigate,
}));
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'test@test.com' } }),
}));
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({ currentAssociation: null }), // Default: no association
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ profile: { role: 'member', name: 'Tester', profile_image: null } }), // Default: member
}));
vi.mock('@/components/theme/ThemeToggle', () => ({
  ThemeToggle: () => <button>ThemeToggle</button>,
}));
vi.mock('@/components/notification/NotificationsDropdown', () => ({
  NotificationsDropdown: () => <div data-testid="notifications">Notifications</div>,
}));
vi.mock('@/components/admin/AssociationSelector', () => ({
  AssociationSelector: () => <div data-testid="assoc-selector">AssocSelector</div>,
}));
vi.mock('@/components/layout/shared/UserMenu', () => ({
  default: (props: any) => <div data-testid="user-menu" data-isadmin={props.isAdmin}>UserMenu</div>,
}));
vi.mock('@/components/ui/MobileNav', () => ({
  MobileNav: () => <div data-testid="mobile-nav">MobileNav</div>,
}));
vi.mock('@/components/search/GlobalSearch', () => ({
  GlobalSearch: () => <input data-testid="global-search" placeholder="Search..." />,
}));

describe('Header', () => {
  beforeEach(() => {
    mockHistoryBack.mockClear();
    // Reset mocks
    vi.doMock('@/contexts/AssociationContext', () => ({
      useAssociation: () => ({ currentAssociation: null }),
    }));
    vi.doMock('react-router-dom', () => ({
      useLocation: () => ({ pathname: '/dashboard' }),
      useNavigate: () => mockNavigate,
    }));
    vi.doMock('@/hooks/useUserProfile', () => ({
      useUserProfile: () => ({ profile: { role: 'member', name: 'Tester', profile_image: null } }),
    }));
  });

  it('renders basic elements when no association selected', () => {
    render(<Header />);
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    expect(screen.getByTestId('assoc-selector')).toBeInTheDocument();
    expect(screen.getByTestId('notifications')).toBeInTheDocument();
    expect(screen.getByText('ThemeToggle')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    // Search and association name should NOT be visible
    expect(screen.queryByTestId('global-search')).not.toBeInTheDocument();
    expect(screen.queryByText(/Test Association/i)).not.toBeInTheDocument();
    // Back button should not be visible on dashboard
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  it('renders association name and search when association is selected', () => {
    vi.doMock('@/contexts/AssociationContext', () => ({
      useAssociation: () => ({ currentAssociation: { id: 'a1', name: 'Test Association' } }),
    }));
    const HeaderReloaded = require('@/components/layout/Header').Header;
    render(<HeaderReloaded />);
    expect(screen.getByText('Test Association')).toBeInTheDocument();
    expect(screen.getByTestId('global-search')).toBeInTheDocument();
  });

  it('renders back button on non-dashboard page with association', () => {
    vi.doMock('@/contexts/AssociationContext', () => ({
      useAssociation: () => ({ currentAssociation: { id: 'a1', name: 'Test Association' } }),
    }));
    vi.doMock('react-router-dom', () => ({
      useLocation: () => ({ pathname: '/inventory/items' }), // Non-dashboard path
      useNavigate: () => mockNavigate,
    }));
    const HeaderReloaded = require('@/components/layout/Header').Header;
    render(<HeaderReloaded />);
    const backButton = screen.getByRole('button'); // More specific selector might be needed
    expect(backButton).toBeInTheDocument(); // Check if a button exists (likely the back button)
    fireEvent.click(backButton);
    expect(mockHistoryBack).toHaveBeenCalled();
  });

  it('passes isAdmin=true to UserMenu for admin role', () => {
    vi.doMock('@/hooks/useUserProfile', () => ({
      useUserProfile: () => ({ profile: { role: 'admin', name: 'Admin User', profile_image: null } }),
    }));
    const HeaderReloaded = require('@/components/layout/Header').Header;
    render(<HeaderReloaded />);
    expect(screen.getByTestId('user-menu')).toHaveAttribute('data-isadmin', 'true');
  });

  it('passes isAdmin=false to UserMenu for member role', () => {
     // Default mock already sets role to 'member'
     render(<Header />);
     expect(screen.getByTestId('user-menu')).toHaveAttribute('data-isadmin', 'false');
   });
});
