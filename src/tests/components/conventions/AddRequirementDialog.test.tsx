import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddRequirementDialog } from '@/components/conventions/AddRequirementDialog';

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

describe('AddRequirementDialog', () => {
  it('renders dialog and form', () => {
    render(
      <AddRequirementDialog
        isOpen={true}
        onClose={vi.fn()}
        conventionId="c1"
        onRequirementAdded={vi.fn()}
      />
    );
    expect(screen.getByText(/Add New Requirement/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Requirement Name/i)).toBeInTheDocument();
  });
});
