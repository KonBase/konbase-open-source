import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConventionLogsTab from '@/components/conventions/ConventionLogsTab';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn(),
    }),
  },
}));
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({ currentAssociation: { id: 'a1' } }),
}));

describe('ConventionLogsTab', () => {
  it('renders logs tab and search', () => {
    render(<ConventionLogsTab conventionId="c1" />);
    expect(screen.getByText(/Activity Logs/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search logs/i)).toBeInTheDocument();
  });
});
