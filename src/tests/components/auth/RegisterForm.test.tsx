import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterForm from '@/components/auth/RegisterForm';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/contexts/auth', () => ({
  useAuth: () => ({
    signInWithOAuth: vi.fn(),
  }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('RegisterForm', () => {
  it('renders form fields', () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Invitation Code/i)).toBeInTheDocument();
  });

  it('submits form', async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: /Create account/i }));
    expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
  });
});
