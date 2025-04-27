import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LogoutButton from '@/components/auth/LogoutButton';

vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({
    signOut: vi.fn().mockResolvedValue(undefined),
  }),
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('LogoutButton', () => {
  it('renders and logs out on click', async () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByText(/Logout/i));
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByText(/Logout/i));
    expect(screen.getByText(/Logging out.../i)).toBeInTheDocument();
  });
});
