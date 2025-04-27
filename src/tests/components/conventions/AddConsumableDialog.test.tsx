import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddConsumableDialog } from '@/components/conventions/AddConsumableDialog';

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
  },
}));

describe('AddConsumableDialog', () => {
  it('renders dialog and form', () => {
    render(
      <AddConsumableDialog
        isOpen={true}
        onClose={vi.fn()}
        conventionId="c1"
        onConsumableAdded={vi.fn()}
      />
    );
    expect(screen.getByText(/Add Consumable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Consumable Item/i)).toBeInTheDocument();
  });
});
