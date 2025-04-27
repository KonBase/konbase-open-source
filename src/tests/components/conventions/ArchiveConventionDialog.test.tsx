import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArchiveConventionDialog from '@/components/conventions/ArchiveConventionDialog';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

describe('ArchiveConventionDialog', () => {
  it('renders archive button and opens dialog', () => {
    render(<ArchiveConventionDialog convention={{
      id: 'c1',
      name: 'Test Convention',
      description: '',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      location: '',
      association_id: 'a1',
      status: 'planned',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }} />);
    fireEvent.click(screen.getByText(/Archive/i));
    expect(screen.getByText(/Archive Convention/i)).toBeInTheDocument();
  });
});
