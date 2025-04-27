import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddTemplateDialog } from '@/components/conventions/AddTemplateDialog';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    },
  },
}));
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({ currentAssociation: { id: 'a1' } }),
}));

describe('AddTemplateDialog', () => {
  it('renders dialog and form', () => {
    render(
      <AddTemplateDialog
        isOpen={true}
        onClose={vi.fn()}
        onTemplateAdded={vi.fn()}
      />
    );
    expect(screen.getByText(/Create Convention Template/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Template Name/i)).toBeInTheDocument();
  });
});
