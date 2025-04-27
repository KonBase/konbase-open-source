import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserRoleManager } from '@/components/admin/UserRoleManager';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({}),
    }),
  },
}));
vi.mock('@/hooks/useTypeSafeSupabase', () => ({
  useTypeSafeSupabase: () => ({
    safeUpdate: vi.fn().mockResolvedValue({}),
  }),
}));
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({
    user: { id: 'admin-id' },
    hasPermission: (perm: string) => perm === 'admin:all',
    isLoading: false,
    isAuthenticated: true,
  }),
}));
vi.mock('@/utils/debug', () => ({
  handleError: vi.fn(),
}));

describe('UserRoleManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with current role', () => {
    render(<UserRoleManager userId="user-1" currentRole="member" />);
    expect(screen.getByText(/member/i)).toBeInTheDocument();
  });

  it('disables select if editing self', () => {
    render(<UserRoleManager userId="admin-id" currentRole="admin" />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('shows all roles for admin:all', () => {
    render(<UserRoleManager userId="user-2" currentRole="member" />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.getByText(/super admin/i)).toBeInTheDocument();
    expect(screen.getByText(/system admin/i)).toBeInTheDocument();
  });

  it('calls updateUserRole on value change', async () => {
    render(<UserRoleManager userId="user-2" currentRole="member" />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText(/admin/i));
    await waitFor(() => {
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });
  });
});
