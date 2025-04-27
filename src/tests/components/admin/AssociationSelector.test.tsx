import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssociationSelector } from '@/components/admin/AssociationSelector';
import React from 'react';

// Mock dependencies
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({
    currentAssociation: { id: 'a1', name: 'Test Association' },
    setCurrentAssociation: vi.fn(),
    userAssociations: [{ id: 'a1', name: 'Test Association' }],
  }),
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { role: 'super_admin' },
  }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockResolvedValue({ data: [] }),
    }),
  },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe('AssociationSelector', () => {
  it('renders current association', () => {
    render(<AssociationSelector />);
    expect(screen.getByText(/Test Association/)).toBeInTheDocument();
  });

  it('shows popover on click', () => {
    render(<AssociationSelector />);
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByText(/Test Association/)).toBeInTheDocument();
  });
});
