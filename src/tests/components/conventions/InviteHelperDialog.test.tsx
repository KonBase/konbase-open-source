import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InviteHelperDialog from '@/components/conventions/InviteHelperDialog';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
  },
}));

describe('InviteHelperDialog', () => {
  it('renders and opens dialog', () => {
    render(
      <InviteHelperDialog
        convention={{
          id: 'c1',
          name: 'Test Convention',
          description: 'A test convention description',
          start_date: '2023-01-01',
          end_date: '2023-01-02',
          location: 'Test Location',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          association_id: 'a1',
          status: 'active',
        }}
      />
    );
    fireEvent.click(screen.getByText(/Invite Helper/i));
    expect(screen.getByText(/Invite Convention Helper/i)).toBeInTheDocument();
  });
});
