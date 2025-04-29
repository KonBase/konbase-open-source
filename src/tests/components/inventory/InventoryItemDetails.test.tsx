import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryItemDetails from '@/components/inventory/InventoryItems';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockItem, error: null }),
    }),
  },
}));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ itemId: 'item1' }),
  Link: (props: any) => <a href={props.to}>{props.children}</a>,
}));

const mockItem = {
  id: 'item1',
  name: 'Tent',
  quantity: 5,
  category: 'Shelter',
  condition: 'Good',
  description: 'A sturdy tent',
  purchase_date: new Date().toISOString(),
  value: 100,
  location_id: 'loc1',
  association_id: 'a1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  location: { id: 'loc1', name: 'Storage Shed' }, // Assuming relation is fetched
};

describe('InventoryItemDetails', () => {
  it('renders item details', async () => {
    render(<InventoryItemDetails />);
    expect(await screen.findByText('Tent')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 5')).toBeInTheDocument();
    expect(screen.getByText('Category: Shelter')).toBeInTheDocument();
    expect(screen.getByText('Condition: Good')).toBeInTheDocument();
    expect(screen.getByText('A sturdy tent')).toBeInTheDocument();
    expect(screen.getByText(/Storage Shed/i)).toBeInTheDocument(); // Check location name
  });

  it('renders loading state', () => {
    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: () => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(() => new Promise(() => {})), // Never resolves
        }),
      },
    }));
    const InventoryItemDetailsReloaded = require('@/components/inventory/InventoryItemDetails').default;
    render(<InventoryItemDetailsReloaded />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // Adjust selector if needed
  });

  it('renders not found state', async () => {
    vi.mock('@/lib/supabase', () => ({
      supabase: {
        from: () => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found', code: 'PGRST116' } }),
        }),
      },
    }));
    const InventoryItemDetailsReloaded = require('@/components/inventory/InventoryItemDetails').default;
    render(<InventoryItemDetailsReloaded />);
    expect(await screen.findByText(/Inventory item not found/i)).toBeInTheDocument();
  });
});
