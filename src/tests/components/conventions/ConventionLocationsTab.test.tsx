import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConventionLocationsTab from '@/components/conventions/ConventionLocationsTab';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    from: () => ({
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
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({ currentAssociation: { id: 'a1' } }),
}));
vi.mock('@/components/conventions/AddLocationDialog', () => ({
  AddLocationDialog: () => <div>AddLocationDialogMock</div>,
}));

describe('ConventionLocationsTab', () => {
  it('renders locations tab and add button', () => {
    render(<ConventionLocationsTab conventionId="c1" />);
    expect(screen.getByText(/Convention Locations/i)).toBeInTheDocument();
    expect(screen.getByText(/Add Location/i)).toBeInTheDocument();
    expect(screen.getByText(/AddLocationDialogMock/)).toBeInTheDocument();
  });
});
