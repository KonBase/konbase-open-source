import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InviteAttendeeDialog } from '@/components/conventions/InviteAttendeeDialog';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('InviteAttendeeDialog', () => {
  it('renders dialog when open', () => {
    render(
      <InviteAttendeeDialog
        isOpen={true}
        conventionId="c1"
        onClose={vi.fn()}
        onInviteSent={vi.fn()}
      />
    );
    expect(screen.getByText(/Invite Convention Attendee/i)).toBeInTheDocument();
  });
});
