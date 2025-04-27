import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddLocationDialog } from '@/components/conventions/AddLocationDialog';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ data: [{}], error: null }),
      update: vi.fn().mockResolvedValue({ data: [{}], error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      delete: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
  },
}));

describe('AddLocationDialog', () => {
  it('renders dialog and form', () => {
    render(
      <AddLocationDialog
        isOpen={true}
        onClose={vi.fn()}
        conventionId="c1"
        onLocationAdded={vi.fn()}
      />
    );
    expect(screen.getByText(/Add New Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location Name/i)).toBeInTheDocument();
  });
});
