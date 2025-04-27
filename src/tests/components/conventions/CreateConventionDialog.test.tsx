import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateConventionDialog from '@/components/conventions/CreateConventionDialog';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({ currentAssociation: { id: 'a1' } }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));
vi.mock('@/components/conventions/ConventionForm', () => ({
  __esModule: true,
  default: (props: any) => <div>ConventionFormMock</div>,
}));

describe('CreateConventionDialog', () => {
  it('renders and opens dialog', () => {
    render(<CreateConventionDialog />);
    fireEvent.click(screen.getByText(/New Convention/i));
    expect(screen.getByText(/Create New Convention/i)).toBeInTheDocument();
    expect(screen.getByText(/ConventionFormMock/)).toBeInTheDocument();
  });
});
