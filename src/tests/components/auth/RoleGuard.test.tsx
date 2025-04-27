import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleGuard } from '@/components/auth/RoleGuard';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({
    userProfile: { role: 'admin', two_factor_enabled: true },
    hasRole: (role: string) => role === 'admin',
    loading: false,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('RoleGuard', () => {
  it('renders children if access granted', () => {
    render(
      <RoleGuard allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleGuard>
    );
    expect(screen.getByText(/Protected Content/)).toBeInTheDocument();
  });
});
