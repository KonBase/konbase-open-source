import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InviteMemberDialog from '@/components/association/InviteMemberDialog';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({ currentAssociation: { id: 'a1' } }),
}));
vi.mock('@/hooks/useTypeSafeSupabase', () => ({
  useTypeSafeSupabase: () => ({ safeInsert: vi.fn().mockResolvedValue({}) }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signUp: vi.fn().mockResolvedValue({ data: {}, error: null }) },
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('InviteMemberDialog', () => {
  it('opens dialog on button click', () => {
    render(<InviteMemberDialog />);
    fireEvent.click(screen.getByText(/Invite Member/i));
    expect(screen.getByText(/Invite Association Member/i)).toBeInTheDocument();
  });
});
