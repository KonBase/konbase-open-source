import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssociationManagement } from '@/components/admin/AssociationManagement';
import React from 'react';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'a1',
            name: 'Association 1',
            description: 'Desc',
            contact_email: 'a1@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      filter: vi.fn().mockReturnThis(),
    }),
  },
}));
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { id: 'admin', role: 'super_admin' },
  }),
}));
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({
    setCurrentAssociation: vi.fn(),
  }),
}));

describe('AssociationManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders associations', async () => {
    render(<AssociationManagement />);
    await waitFor(() => {
      expect(screen.getByText(/Association 1/)).toBeInTheDocument();
    });
  });

  it('shows new association dialog', () => {
    render(<AssociationManagement />);
    fireEvent.click(screen.getByText(/New Association/i));
    expect(screen.getByText(/Create New Association/i)).toBeInTheDocument();
  });
});
