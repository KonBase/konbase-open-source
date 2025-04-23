import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
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
import { logDebug } from '@/utils/debug';
import { cn } from '@/lib/utils';

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const { safeSelect, safeUpdate, supabase } = useTypeSafeSupabase();
  
  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
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
        logDebug('Error fetching notifications:', error, 'error');
        setError('Unable to load notifications. Please try again later.');
        
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000);
        }
      } else {
        setNotifications(data || []);
        setError(null);
      }
    } catch (err) {
      logDebug('Error fetching notifications:', err, 'error');
      setError('Unable to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNotifications();
    
    let channel;
    if (user) {
      try {
        setTimeout(() => {
          if (supabase) {
            channel = supabase
              .channel('notifications-changes')
              .on(
                'postgres_changes',
                {
                  event: 'INSERT', 
                  schema: 'public',
                  table: 'notifications',
                  filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                  try {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
                    
                    toast({
                      title: newNotification.title,
                      description: newNotification.message,
                    });
                  } catch (error) {
                    logDebug('Error processing notification update:', error, 'error');
                  }
                }
              )
              .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  logDebug('Successfully subscribed to notifications', null, 'info');
                } else if (status === 'CHANNEL_ERROR') {
                  logDebug('Error subscribing to notifications', null, 'error');
                }
              });
          }
        }, 0);
      } catch (error) {
        logDebug('Error setting up notification subscription:', error, 'error');
      }
    }
    
    return () => {
      if (channel && supabase) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          logDebug('Error removing notification channel:', error, 'error');
        }
      }
    };
  }, [user, toast, retryCount]);
  
  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await safeUpdate(
        'notifications',
        { read: true },
        { column: 'id', value: id }
      );
      
      if (error) {
        logDebug('Error marking notification as read:', error, 'error');
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
      logDebug('Error marking notification as read:', error, 'error');
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
      logDebug('Error marking all notifications as read:', error, 'error');
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
