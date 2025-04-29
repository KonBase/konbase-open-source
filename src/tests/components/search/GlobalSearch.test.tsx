import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { GlobalSearch } from '@/components/search/GlobalSearch'; // Adjust path
import React from 'react';

// --- Mocks ---
const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockSupabaseFrom = vi.fn();

// Mock Supabase client and methods
const mockSupabase = {
    from: mockSupabaseFrom,
};

// Mock specific table queries
const mockItemsQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    in: vi.fn().mockReturnThis(), // Add 'in' for category/item name lookups
};
const mockCategoriesQuery = { ...mockItemsQuery }; // Clone basic structure
const mockLocationsQuery = { ...mockItemsQuery };
const mockSetsQuery = { ...mockItemsQuery };
const mockDocumentsQuery = { ...mockItemsQuery };
const mockConventionsQuery = { ...mockItemsQuery, order: vi.fn().mockReturnThis() };
const mockMembersQuery = { ...mockItemsQuery };
const mockProfilesQuery = { ...mockItemsQuery };

mockSupabaseFrom.mockImplementation((tableName: string) => {
    if (tableName === 'items') return mockItemsQuery;
    if (tableName === 'categories') return mockCategoriesQuery;
    if (tableName === 'locations') return mockLocationsQuery;
    if (tableName === 'equipment_sets') return mockSetsQuery;
    if (tableName === 'documents') return mockDocumentsQuery;
    if (tableName === 'conventions') return mockConventionsQuery;
    if (tableName === 'association_members') return mockMembersQuery;
    if (tableName === 'profiles') return mockProfilesQuery;
    // Default fallback
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
    };
});


vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));
vi.mock('@/hooks/useDebounce', () => ({
    // Simple debounce mock: return value immediately for testing
    useDebounce: (value: any, delay: number) => value,
}));
vi.mock('@/lib/supabase', () => ({
    supabase: mockSupabase,
}));
vi.mock('@/contexts/AssociationContext', () => ({
    useAssociation: () => ({ currentAssociation: { id: 'assoc-1' } }), // Assume association is selected
}));
vi.mock('@/hooks/useUserProfile', () => ({
    useUserProfile: () => ({ profile: { role: 'member' } }), // Default role
}));
vi.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({ toast: mockToast }),
}));
vi.mock('@/utils/debug', () => ({
    logDebug: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props}>{props.children}</button> }));
vi.mock('@/components/ui/skeleton', () => ({ Skeleton: (props: any) => <div data-testid="skeleton" {...props}></div> }));
vi.mock('@/components/ui/badge', () => ({ Badge: (props: any) => <span {...props}>{props.children}</span> }));
vi.mock('@/components/ui/command', () => ({
    CommandDialog: ({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (open: boolean) => void }) =>
        open ? <div data-testid="command-dialog">{children}</div> : null,
    CommandInput: (props: any) => <input data-testid="command-input" {...props} />,
    CommandList: ({ children }: { children: React.ReactNode }) => <div data-testid="command-list">{children}</div>,
    CommandEmpty: ({ children }: { children: React.ReactNode }) => <div data-testid="command-empty">{children}</div>,
    CommandGroup: ({ children, heading }: { children: React.ReactNode, heading: string }) => <div data-testid={`group-${heading.toLowerCase()}`}>{children}</div>,
    CommandItem: ({ children, onSelect, value }: { children: React.ReactNode, onSelect: () => void, value: string }) =>
        <div data-testid={`item-${value}`} onClick={onSelect} role="option">{children}</div>,
    CommandSeparator: () => <hr />,
}));

// --- Test Data ---
const mockItemResult = { id: 'item-1', name: 'Tent', description: 'A large tent', is_consumable: false, category_id: 'cat-1' };
const mockCategoryResult = { id: 'cat-1', name: 'Shelter', description: 'Housing items' };
const mockLocationResult = { id: 'loc-1', name: 'Shed A', description: 'Main storage' };
const mockSetResult = { id: 'set-1', name: 'Camping Set', description: 'Basic camping gear' };
const mockConventionResult = { id: 'conv-1', name: 'Summer Camp', description: 'Annual event', status: 'Active' };
const mockMemberResult = { id: 'user-admin', name: 'Admin User', email: 'admin@test.com', role: 'admin' };

// --- Tests ---
describe('GlobalSearch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockNavigate.mockClear();
        mockToast.mockClear();
        mockSupabaseFrom.mockClear();
        // Reset all query mocks
        Object.values(mockItemsQuery).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear().mockReturnThis());
        Object.values(mockCategoriesQuery).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear().mockReturnThis());
        Object.values(mockLocationsQuery).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear().mockReturnThis());
        Object.values(mockSetsQuery).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear().mockReturnThis());
        Object.values(mockDocumentsQuery).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear().mockReturnThis());
        Object.values(mockConventionsQuery).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear().mockReturnThis());
        Object.values(mockMembersQuery).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear().mockReturnThis());
        Object.values(mockProfilesQuery).forEach(mockFn => typeof mockFn === 'function' && mockFn.mockClear().mockReturnThis());

        // Default successful empty results for all
        mockItemsQuery.limit.mockResolvedValue({ data: [], error: null });
        mockCategoriesQuery.limit.mockResolvedValue({ data: [], error: null });
        mockLocationsQuery.limit.mockResolvedValue({ data: [], error: null });
        mockSetsQuery.limit.mockResolvedValue({ data: [], error: null });
        mockDocumentsQuery.limit.mockResolvedValue({ data: [], error: null });
        mockConventionsQuery.limit.mockResolvedValue({ data: [], error: null });
        mockMembersQuery.limit.mockResolvedValue({ data: [], error: null });
        mockProfilesQuery.limit.mockResolvedValue({ data: [], error: null });

        // Mock category lookup needed for item results
        mockCategoriesQuery.select.mockResolvedValue({ data: [mockCategoryResult], error: null });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('renders search button', () => {
        render(<GlobalSearch />);
        expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
    });

    it('opens command dialog on button click', () => {
        render(<GlobalSearch />);
        expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));
        expect(screen.getByTestId('command-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('command-input')).toBeInTheDocument();
    });

    it('opens command dialog with Ctrl+K', () => {
        render(<GlobalSearch />);
        expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
        expect(screen.getByTestId('command-dialog')).toBeInTheDocument();
    });

    it('performs search when query is entered (debounced)', async () => {
        render(<GlobalSearch />);
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));
        const input = screen.getByTestId('command-input');

        await act(async () => {
            fireEvent.change(input, { target: { value: 'tent' } });
            await vi.advanceTimersByTimeAsync(350); // Wait for debounce + processing
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('items');
        expect(mockSupabase.from).toHaveBeenCalledWith('categories');
        expect(mockSupabase.from).toHaveBeenCalledWith('locations');
        // Add checks for other tables searched
    });

    it('shows loading state while searching', async () => {
        // Make one query take longer
        mockItemsQuery.limit.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ data: [], error: null }), 500)));

        render(<GlobalSearch />);
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));
        const input = screen.getByTestId('command-input');

        fireEvent.change(input, { target: { value: 'tent' } });

        // Should show loading immediately after change (due to debounce mock)
        await waitFor(() => {
            expect(screen.queryAllByTestId('skeleton').length).toBeGreaterThan(0);
        });

        // Advance time to resolve the promise
        await act(async () => {
            await vi.advanceTimersByTimeAsync(550);
        });

        // Loading should disappear
        await waitFor(() => {
            expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
        });
    });

    it('shows "No results found" message', async () => {
        // Ensure all queries return empty data
        mockItemsQuery.limit.mockResolvedValue({ data: [], error: null });
        mockCategoriesQuery.limit.mockResolvedValue({ data: [], error: null });
        // ... mock others as empty ...

        render(<GlobalSearch />);
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));
        const input = screen.getByTestId('command-input');

        await act(async () => {
            fireEvent.change(input, { target: { value: 'xyz123' } });
            await vi.advanceTimersByTimeAsync(50); // Allow state updates
        });


        expect(await screen.findByTestId('command-empty')).toBeInTheDocument();
        expect(screen.getByText(/No results found for "xyz123"/i)).toBeInTheDocument();
    });

    it('displays search results grouped by type', async () => {
        mockItemsQuery.limit.mockResolvedValue({ data: [mockItemResult], error: null });
        mockLocationsQuery.limit.mockResolvedValue({ data: [mockLocationResult], error: null });
        mockConventionsQuery.limit.mockResolvedValue({ data: [mockConventionResult], error: null });

        render(<GlobalSearch />);
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));
        const input = screen.getByTestId('command-input');

        await act(async () => {
            fireEvent.change(input, { target: { value: 'camp' } });
            await vi.advanceTimersByTimeAsync(50); // Allow state updates
        });

        // Wait for results to render
        expect(await screen.findByTestId('group-inventory')).toBeInTheDocument();
        expect(screen.getByTestId('item-item-Tent-item-1')).toBeInTheDocument(); // Check specific item
        expect(screen.getByText('Tent')).toBeInTheDocument();
        expect(screen.getByText('Shelter')).toBeInTheDocument(); // Description from category lookup

        expect(screen.getByTestId('group-inventory')).toContainElement(screen.getByTestId('item-location-Shed A-loc-1'));
        expect(screen.getByText('Shed A')).toBeInTheDocument();

        expect(await screen.findByTestId('group-conventions')).toBeInTheDocument();
        expect(screen.getByTestId('item-convention-Summer Camp-conv-1')).toBeInTheDocument();
        expect(screen.getByText('Summer Camp')).toBeInTheDocument();
    });

    it('navigates when a result is selected', async () => {
        mockItemsQuery.limit.mockResolvedValue({ data: [mockItemResult], error: null });

        render(<GlobalSearch />);
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));
        const input = screen.getByTestId('command-input');

        await act(async () => {
            fireEvent.change(input, { target: { value: 'tent' } });
            await vi.advanceTimersByTimeAsync(50); // Allow state updates
        });

        const resultItem = await screen.findByTestId('item-item-Tent-item-1');
        fireEvent.click(resultItem);

        expect(mockNavigate).toHaveBeenCalledWith('/inventory/items?id=item-1');
        // Dialog should close
        expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
    });

    it('shows error toast on search failure', async () => {
        mockItemsQuery.limit.mockRejectedValue(new Error('DB connection failed'));

        render(<GlobalSearch />);
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));
        const input = screen.getByTestId('command-input');

        await act(async () => {
            fireEvent.change(input, { target: { value: 'error' } });
            await vi.advanceTimersByTimeAsync(50); // Allow state updates
        });

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Search Error',
                variant: 'destructive',
            }));
        });
    });

    it('searches members only if user is admin', async () => {
        // Mock user profile as admin
        vi.mocked(require('@/hooks/useUserProfile')).useUserProfile.mockReturnValue({ profile: { role: 'admin' } });
        mockProfilesQuery.limit.mockResolvedValue({ data: [mockMemberResult], error: null });
        // Mock association_members lookup
        mockMembersQuery.limit.mockResolvedValue({ data: [{ user_id: 'user-admin' }], error: null });


        render(<GlobalSearch />);
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));
        const input = screen.getByTestId('command-input');

        await act(async () => {
            fireEvent.change(input, { target: { value: 'admin' } });
            await vi.advanceTimersByTimeAsync(50); // Allow state updates
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('association_members');
        expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
        expect(await screen.findByTestId('group-association members')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    it('does NOT search members if user is member', async () => {
         // User profile is 'member' by default in this test suite setup
         render(<GlobalSearch />);
         fireEvent.click(screen.getByRole('button', { name: /Search/i }));
         const input = screen.getByTestId('command-input');

         await act(async () => {
             fireEvent.change(input, { target: { value: 'admin' } });
             await vi.advanceTimersByTimeAsync(50); // Allow state updates
         });

         expect(mockSupabase.from).not.toHaveBeenCalledWith('association_members');
         expect(mockSupabase.from).not.toHaveBeenCalledWith('profiles');
         expect(screen.queryByTestId('group-association members')).not.toBeInTheDocument();
     });
});
