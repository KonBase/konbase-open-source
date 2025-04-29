import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NotificationsDropdown } from '@/components/notification/NotificationsDropdown'; // Adjust path
import React from 'react';

// --- Mocks ---
const mockToast = vi.fn();
const mockSafeSelect = vi.fn();
const mockSafeUpdate = vi.fn();
const mockSubscribe = vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((callback) => {
        // Simulate successful subscription after a short delay
        setTimeout(() => callback('SUBSCRIBED'), 10);
        return { unsubscribe: vi.fn() };
    }),
}));
const mockRemoveChannel = vi.fn();
const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: mockSubscribe,
};
const mockSupabase = {
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
};

vi.mock('@/hooks/useTypeSafeSupabase', () => ({
    useTypeSafeSupabase: () => ({
        safeSelect: mockSafeSelect,
        safeUpdate: mockSafeUpdate,
        supabase: mockSupabase,
    }),
}));
vi.mock('@/contexts/auth', () => ({
    useAuth: () => ({ user: { id: 'user-123' } }),
}));
vi.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({ toast: mockToast }),
}));
vi.mock('react-router-dom', () => ({
    Link: (props: any) => <a href={props.to}>{props.children}</a>,
}));
vi.mock('@/utils/debug', () => ({
    logDebug: vi.fn(),
    isDebugModeEnabled: () => false,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({ Button: (props: any) => <button {...props}>{props.children}</button> }));
vi.mock('@/components/ui/badge', () => ({ Badge: (props: any) => <span {...props}>{props.children}</span> }));
vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, ...props }: { children: React.ReactNode, className?: string }) => <div {...props}>{children}</div>,
    DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
}));

// --- Test Data ---
const mockNotifications = [
    { id: 'n1', user_id: 'user-123', title: 'Unread Notification', message: 'This is important', read: false, created_at: new Date().toISOString(), link: '/some/link' },
    { id: 'n2', user_id: 'user-123', title: 'Read Notification', message: 'This is old', read: true, created_at: new Date(Date.now() - 86400000).toISOString(), link: null },
];

// --- Tests ---
describe('NotificationsDropdown', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockSafeSelect.mockResolvedValue({ data: [], error: null }); // Default empty
        mockSafeUpdate.mockResolvedValue({ error: null });
        mockToast.mockClear();
        mockSupabase.channel.mockClear();
        mockRemoveChannel.mockClear();
        mockSubscribe.mockClear();
        // Reset channel mock return value for each test
        vi.mocked(mockSupabase.channel).mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: mockSubscribe,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('renders loading state initially', async () => {
        mockSafeSelect.mockImplementation(() => new Promise(() => {})); // Never resolves
        render(<NotificationsDropdown />);
        // Need to open the dropdown to see the content
        fireEvent.click(screen.getByRole('button')); // Assuming trigger is a button
        expect(await screen.findByText(/Loading notifications/i)).toBeInTheDocument();
    });

    it('renders error state on fetch failure', async () => {
        mockSafeSelect.mockResolvedValue({ data: null, error: { message: 'Fetch failed' } });
        render(<NotificationsDropdown />);
        fireEvent.click(screen.getByRole('button'));
        expect(await screen.findByText(/Unable to load notifications/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('renders empty state when no notifications', async () => {
        mockSafeSelect.mockResolvedValue({ data: [], error: null });
        render(<NotificationsDropdown />);
        fireEvent.click(screen.getByRole('button'));
        expect(await screen.findByText(/You have no notifications/i)).toBeInTheDocument();
    });

    it('renders list of notifications and unread count badge', async () => {
        mockSafeSelect.mockResolvedValue({ data: mockNotifications, error: null });
        render(<NotificationsDropdown />);

        // Check badge before opening
        expect(screen.getByText('1')).toBeInTheDocument(); // Unread count

        fireEvent.click(screen.getByRole('button')); // Open dropdown

        expect(await screen.findByText('Unread Notification')).toBeInTheDocument();
        expect(screen.getByText('Read Notification')).toBeInTheDocument();
        expect(screen.getByText('Mark all as read')).toBeInTheDocument(); // Should be visible if unread > 0
    });

    it('marks a notification as read when checkmark clicked', async () => {
        mockSafeSelect.mockResolvedValue({ data: mockNotifications, error: null });
        render(<NotificationsDropdown />);
        fireEvent.click(screen.getByRole('button')); // Open dropdown

        const unreadItem = await screen.findByText('Unread Notification');
        // Find the checkmark button within the unread item's container
        const checkButton = unreadItem.closest('div')?.querySelector('button'); // Adjust selector based on actual structure
        expect(checkButton).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(checkButton!);
            await vi.advanceTimersByTimeAsync(50); // Allow state update
        });


        expect(mockSafeUpdate).toHaveBeenCalledWith('notifications', { read: true }, { column: 'id', value: 'n1' });
        // Optionally check if UI updates (e.g., opacity changes or button disappears)
        // This depends heavily on the exact implementation and might require more complex selectors
    });

    it('marks all notifications as read when "Mark all as read" clicked', async () => {
        mockSafeSelect.mockResolvedValue({ data: mockNotifications, error: null });
        render(<NotificationsDropdown />);
        fireEvent.click(screen.getByRole('button')); // Open dropdown

        const markAllButton = await screen.findByRole('button', { name: /Mark all as read/i });
        await act(async () => {
            fireEvent.click(markAllButton);
            await vi.advanceTimersByTimeAsync(50); // Allow state update
        });


        // Should only be called for the unread notification 'n1'
        expect(mockSafeUpdate).toHaveBeenCalledTimes(1);
        expect(mockSafeUpdate).toHaveBeenCalledWith('notifications', { read: true }, { column: 'id', value: 'n1' });
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "All notifications marked as read" }));
    });

    it('refreshes notifications when refresh button clicked', async () => {
        mockSafeSelect.mockResolvedValue({ data: mockNotifications, error: null });
        render(<NotificationsDropdown />);
        fireEvent.click(screen.getByRole('button')); // Open dropdown

        const refreshButton = await screen.findByTitle(/Connected. Click to refresh/i); // Use title to find refresh
        expect(mockSafeSelect).toHaveBeenCalledTimes(1); // Initial fetch

        await act(async () => {
            fireEvent.click(refreshButton);
            await vi.advanceTimersByTimeAsync(50); // Allow state update
        });

        expect(mockSafeSelect).toHaveBeenCalledTimes(2); // Should fetch again
    });

    it('attempts to subscribe to realtime updates', async () => {
        render(<NotificationsDropdown />);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1100); // Wait for initial delay + subscription attempt
        });
        expect(mockSupabase.channel).toHaveBeenCalled();
        expect(mockSubscribe).toHaveBeenCalled();
    });

     it('shows WebSocket error state', async () => {
         // Simulate subscription error
         mockSubscribe.mockImplementationOnce(callback => {
             setTimeout(() => callback('CHANNEL_ERROR'), 10);
             return { unsubscribe: vi.fn() };
         });

         render(<NotificationsDropdown />);
         fireEvent.click(screen.getByRole('button')); // Open dropdown

         await act(async () => {
             await vi.advanceTimersByTimeAsync(1100); // Wait for initial delay + subscription attempt
         });

         expect(await screen.findByText(/Real-time updates unavailable/i)).toBeInTheDocument();
         expect(screen.getByRole('button', { name: /Retry connection/i })).toBeInTheDocument();
         // Check if Bell icon has error class (depends on cn implementation)
         // const bellIcon = screen.getByRole('button').querySelector('svg'); // Find Bell icon
         // expect(bellIcon).toHaveClass('text-red-500'); // Check for error color class
     });
});
