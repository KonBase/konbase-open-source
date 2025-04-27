import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import JoinConventionForm from '@/components/conventions/JoinConventionForm';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ user: { user: { id: 'u1' } } }),
    },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'inv1', convention_id: 'c1', code: 'CODE', expires_at: new Date(Date.now() + 10000).toISOString(), uses_remaining: 1 }, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('JoinConventionForm', () => {
  it('renders input and buttons', () => {
    render(<JoinConventionForm />);
    expect(screen.getByLabelText(/Invitation Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Join Convention/i)).toBeInTheDocument();
    expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
  });

  it('shows error if code is empty', () => {
    render(<JoinConventionForm />);
    fireEvent.click(screen.getByText(/Join Convention/i));
    expect(screen.getByText(/Join Convention/i)).toBeInTheDocument();
  });
});
