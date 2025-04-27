import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddEquipmentDialog } from '@/components/conventions/AddEquipmentDialog';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
  },
}));

describe('AddEquipmentDialog', () => {
  it('renders dialog and form', () => {
    render(
      <AddEquipmentDialog
        isOpen={true}
        onClose={vi.fn()}
        conventionId="c1"
        onEquipmentAdded={vi.fn()}
      />
    );
    expect(screen.getByText(/Add Equipment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Equipment Item/i)).toBeInTheDocument();
  });
});
