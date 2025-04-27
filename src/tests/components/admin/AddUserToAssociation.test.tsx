import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddUserToAssociation } from '@/components/admin/AddUserToAssociation';
import '@testing-library/jest-dom';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'user-1' },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));
vi.mock('@/utils/debug', () => ({
  handleError: vi.fn(),
}));

describe('AddUserToAssociation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    render(<AddUserToAssociation associationId="a1" />);
    expect(screen.getByLabelText(/User Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
  });

  it('submits form and resets', async () => {
    render(<AddUserToAssociation associationId="a1" />);
    fireEvent.change(screen.getByLabelText(/User Email/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText(/Add User/i));
    await waitFor(() => {
      expect(screen.getByLabelText(/User Email/i)).toHaveValue('');
    });
  });
});
