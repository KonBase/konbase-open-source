import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, RefreshCw } from 'lucide-react';
import { useTypeSafeSupabase } from '@/hooks/useTypeSafeSupabase';
import { useAuth } from '@/contexts/auth';
import { Notification } from '@/types/notification';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { logDebug, isDebugModeEnabled } from '@/utils/debug';
import { cn } from '@/lib/utils';

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { safeSelect, safeUpdate, supabase } = useTypeSafeSupabase();
  const channelRef = useRef<any>(null);
  const subscriptionAttemptRef = useRef<number>(0);
  const debugModeEnabledRef = useRef<boolean>(isDebugModeEnabled());
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const fetchDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track debug mode changes
  useEffect(() => {
    const checkDebugMode = () => {
      const current = isDebugModeEnabled();
      if (current !== debugModeEnabledRef.current) {
        debugModeEnabledRef.current = current;
      }
    };
    
    const intervalId = setInterval(checkDebugMode, 5000);
    return () => clearInterval(intervalId);
  }, []);
  
  const fetchNotifications = useCallback(async (force = false) => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current && !force) {
      return;
    }
    
    // Add cooldown period to prevent rapid subsequent calls
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    const minFetchInterval = 2000; // 2 seconds
    
    if (timeSinceLastFetch < minFetchInterval && !force) {
      if (fetchDebounceTimeoutRef.current) {
        clearTimeout(fetchDebounceTimeoutRef.current);
      }
      
      // Debounce the fetch request
      fetchDebounceTimeoutRef.current = setTimeout(() => {
        fetchNotifications(true);
      }, minFetchInterval - timeSinceLastFetch);
      
      return;
    }
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    
    if (!loading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const { data, error } = await safeSelect(
        'notifications',
        '*',
        {
          column: 'user_id',
          value: user.id,
          order: {
            column: 'created_at',
            ascending: false
          },
          limit: 10
        }
      );
      
      if (error) {
        if (debugModeEnabledRef.current) {
          logDebug('Error fetching notifications:', error, 'error');
        }
        setError('Unable to load notifications. Please try again later.');
        
        // Only attempt retry if we haven't exceeded retry count and if error is likely recoverable
        const isNetworkError = error.message?.includes('fetch') || error.details?.includes('fetch');
        if (retryCount < 3 && isNetworkError) {
          // Exponential backoff with jitter
          const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 10000) + Math.random() * 1000;
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchNotifications(true);
          }, retryDelay);
        }
      } else {
        setNotifications(data || []);
        setError(null);
        // Reset retry count on success
        if (retryCount > 0) {
          setRetryCount(0);
        }
      }
    } catch (err) {
      if (debugModeEnabledRef.current) {
        logDebug('Error fetching notifications:', err, 'error');
      }
      setError('Unable to load notifications. Please try again later.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, safeSelect, retryCount, loading]);
  
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !supabase || isSubscribing) return;
    
    // Add a cooldown between subscription attempts
    const now = Date.now();
    const minInterval = 5000; // 5 seconds between attempts
    if (subscriptionAttemptRef.current > 0 && now - lastFetchTimeRef.current < minInterval) {
      return;
    }
    
    // Avoid multiple subscriptions in rapid succession
    const currentAttempt = subscriptionAttemptRef.current + 1;
    subscriptionAttemptRef.current = currentAttempt;
    
    setIsSubscribing(true);
    try {
      // Clean up any existing subscription to prevent duplicates
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      // Create new subscription with a unique channel name to avoid conflicts
      const channelName = `notifications-changes-${user.id}-${currentAttempt}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT', 
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Only process if this is still the current subscription attempt
            if (subscriptionAttemptRef.current !== currentAttempt) return;
            
            try {
              const newNotification = payload.new as Notification;
              setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
              
              toast({
                title: newNotification.title,
                description: newNotification.message,
              });
            } catch (error) {
              if (debugModeEnabledRef.current) {
                logDebug('Error processing notification update:', error, 'error');
              }
            }
          }
        )
        .subscribe((status) => {
          // Only process if this is still the current subscription attempt
          if (subscriptionAttemptRef.current !== currentAttempt) return;
          
          if (status === 'SUBSCRIBED') {
            setSubscribed(true);
            setIsSubscribing(false);
            if (debugModeEnabledRef.current) {
              logDebug(`Successfully subscribed to notifications (attempt ${currentAttempt})`, null, 'info');
            }
          } else if (status === 'CHANNEL_ERROR') {
            setSubscribed(false);
            setIsSubscribing(false);
            if (debugModeEnabledRef.current) {
              logDebug(`Error subscribing to notifications (attempt ${currentAttempt})`, null, 'error');
            }
            // Try to resubscribe after a delay with exponential backoff
            const retryDelay = Math.min(3000 * Math.pow(2, Math.min(subscriptionAttemptRef.current, 4)), 30000);
            setTimeout(() => {
              if (subscriptionAttemptRef.current === currentAttempt) {
                setupRealtimeSubscription();
              }
            }, retryDelay);
          }
        });
        
      // Store channel reference for cleanup
      channelRef.current = channel;
    } catch (error) {
      if (debugModeEnabledRef.current) {
        logDebug(`Error setting up notification subscription (attempt ${currentAttempt}):`, error, 'error');
      }
      setSubscribed(false);
      setIsSubscribing(false);
    }
  }, [user, supabase, toast]);
  
  // Set up initial subscription and fetch notifications
  useEffect(() => {
    // Only fetch if user is logged in and component is mounted
    if (user) {
      fetchNotifications();
    }
    
    // Only attempt to set up subscription if we have the required dependencies
    if (user && supabase && !isSubscribing && !subscribed) {
      // Add a small delay before initial subscription to prevent rapid setup on mount
      const initialDelay = 1000; // 1 second
      const timeoutId = setTimeout(() => {
        setupRealtimeSubscription();
      }, initialDelay);
      
      return () => clearTimeout(timeoutId);
    }
    
    return () => {
      if (fetchDebounceTimeoutRef.current) {
        clearTimeout(fetchDebounceTimeoutRef.current);
        fetchDebounceTimeoutRef.current = null;
      }
      
      if (channelRef.current && supabase) {
        try {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
          // Just update the refs to prevent further subscription attempts
          subscriptionAttemptRef.current = 0;
        } catch (error) {
          if (debugModeEnabledRef.current) {
            logDebug('Error removing notification channel:', error, 'error');
          }
        }
      }
    };
  }, [user, fetchNotifications, supabase, setupRealtimeSubscription, isSubscribing, subscribed]);
  
  // Resubscribe when retryCount changes
  useEffect(() => {
    if (retryCount > 0 && user && supabase && !isSubscribing) {
      // Add delay before resubscribing
      const retryDelay = 3000 + (retryCount * 1000); // Increasing delay with retry count
      const timeoutId = setTimeout(() => {
        setupRealtimeSubscription();
      }, retryDelay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [retryCount, user, supabase, setupRealtimeSubscription, isSubscribing]);
  
  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await safeUpdate(
        'notifications',
        { read: true },
        { column: 'id', value: id }
      );
      
      if (error) {
        if (debugModeEnabledRef.current) {
          logDebug('Error marking notification as read:', error, 'error');
        }
        toast({
          title: "Error",
          description: "Failed to mark notification as read. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      if (debugModeEnabledRef.current) {
        logDebug('Error marking notification as read:', error, 'error');
      }
      toast({
        title: "Error",
        description: "Failed to mark notification as read. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);
        
      if (unreadIds.length === 0) return;
      
      const updatePromises = unreadIds.map(id => 
        safeUpdate('notifications', { read: true }, { column: 'id', value: id })
      );
      
      const results = await Promise.allSettled(updatePromises);
      const hasErrors = results.some(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && result.value.error)
      );
      
      if (hasErrors) {
        toast({
          title: "Warning",
          description: "Some notifications could not be marked as read.",
          variant: "destructive"
        });
      } else {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        
        toast({
          title: "All notifications marked as read",
        });
      }
    } catch (error) {
      if (debugModeEnabledRef.current) {
        logDebug('Error marking all notifications as read:', error, 'error');
      }
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const isMobile = window.innerWidth < 768; // Simple mobile detection
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("w-80", isMobile && "w-[calc(100vw-40px)] max-w-[350px]")}>
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-7"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                // Force refresh but ensure we're not in a loading state
                if (!loading && !isFetchingRef.current) {
                  setRetryCount(0);
                  fetchNotifications(true); // Pass true to force fetch
                  
                  // Only attempt to setup realtime if not already subscribing
                  if (!isSubscribing) {
                    setupRealtimeSubscription();
                  }
                }
              }}
              title="Refresh notifications"
              disabled={loading || isFetchingRef.current}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className={cn("overflow-y-auto", isMobile ? "max-h-[50vh]" : "max-h-[400px]")}>
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  setRetryCount(0);
                  fetchNotifications();
                  setupRealtimeSubscription();
                }}
              >
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">You have no notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className={`flex flex-col items-start p-3 ${notification.read ? 'opacity-70' : 'bg-muted/50'}`}
              >
                <div className="flex w-full justify-between items-start">
                  <div className="font-medium text-sm">{notification.title}</div>
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                {notification.link && (
                  <Link 
                    to={notification.link} 
                    className="text-xs text-primary mt-1"
                    onClick={() => markAsRead(notification.id)}
                  >
                    View details
                  </Link>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
