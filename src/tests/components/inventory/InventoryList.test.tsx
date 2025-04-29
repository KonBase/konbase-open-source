import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      order: vi.fn().mockReturnThis(),
    }),
  },
}));
vi.mock('@/contexts/AssociationContext', () => ({
  useAssociation: () => ({ currentAssociation: { id: 'a1' } }),
}));

const mockItems = [
  { id: 'item1', name: 'Tent', quantity: 5, category: 'Shelter', condition: 'Good', location_id: 'loc1', association_id: 'a1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'item2', name: 'Sleeping Bag', quantity: 10, category: 'Sleeping', condition: 'Fair', location_id: 'loc2', association_id: 'a1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

describe('InventoryList', () => {
  it('renders loading state initially', () => {
    // Mock supabase to be pending
    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: () => ({
          select: vi.fn(() => new Promise(() => {})), // Never resolves
          order: vi.fn().mockReturnThis(),
        }),
      },
    }));
    const InventoryListReloaded = require('@/components/inventory/InventoryList').default;
    render(<InventoryListReloaded />);
    // Check for a loading indicator (adjust selector as needed)
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders empty state when no items', async () => {
    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: () => ({
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
          order: vi.fn().mockReturnThis(),
        }),
      },
    }));
    const InventoryListReloaded = require('@/components/inventory/InventoryList').default;
    render(<InventoryListReloaded />);
    expect(await screen.findByText(/No inventory items found/i)).toBeInTheDocument();
  });

  it('renders list of items', async () => {
    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: () => ({
          select: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
          order: vi.fn().mockReturnThis(),
        }),
      },
    }));
    const InventoryListReloaded = require('@/components/inventory/InventoryList').default;
    render(<InventoryListReloaded />);
    expect(await screen.findByText('Tent')).toBeInTheDocument();
    expect(await screen.findByText('Sleeping Bag')).toBeInTheDocument();
  });
});
