
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { useTypeSafeSupabase } from '@/hooks/useTypeSafeSupabase';
import { useLocation, useNavigate } from 'react-router-dom';
import { logDebug } from '@/utils/debug';

// Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import NoAssociationView from '@/components/dashboard/NoAssociationView';
import AssociationManagementSection from '@/components/dashboard/AssociationManagementSection';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import CommunicationSection from '@/components/dashboard/CommunicationSection';
import LocationManagerView from '@/components/dashboard/LocationManagerView';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const location = useLocation();
  const navigate = useNavigate();
  const { safeSelect, supabase } = useTypeSafeSupabase();
  
  const [stats, setStats] = useState({
    itemsCount: 0,
    categoriesCount: 0,
    locationsCount: 0,
    conventionsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle redirect from setupWizard if there's a 'completed' query param
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('completed') === 'true') {
      toast({
        title: "Setup completed",
        description: "Welcome to your dashboard!"
      });
      // Clear the query parameter
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate]);

  // Separate effect for fetching stats to avoid dependencies issues
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!currentAssociation || !user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Using a more resilient approach with safeSelect and parallel requests
        const [
          itemsResponse,
          categoriesResponse,
          locationsResponse,
          conventionsResponse,
          notificationsResponse
        ] = await Promise.allSettled([
          // Fetch items count
          safeSelect('items', '*', { 
            column: 'association_id', 
            value: currentAssociation.id 
          }),
          
          // Fetch categories count
          safeSelect('categories', '*', { 
            column: 'association_id', 
            value: currentAssociation.id 
          }),
          
          // Fetch locations count
          safeSelect('locations', '*', { 
            column: 'association_id', 
            value: currentAssociation.id 
          }),
          
          // Fetch conventions count
          safeSelect('conventions', '*', { 
            column: 'association_id', 
            value: currentAssociation.id 
          }),
          
          // Fetch unread notifications count
          safeSelect('notifications', '*', { 
            column: 'user_id', 
            value: user.id,
            order: {
              column: 'created_at',
              ascending: false
            }
          })
        ]);
        
        // Process results, handling any failures gracefully
        const itemsCount = itemsResponse.status === 'fulfilled' ? (itemsResponse.value.data?.length || 0) : 0;
        const categoriesCount = categoriesResponse.status === 'fulfilled' ? (categoriesResponse.value.data?.length || 0) : 0;
        const locationsCount = locationsResponse.status === 'fulfilled' ? (locationsResponse.value.data?.length || 0) : 0;
        const conventionsCount = conventionsResponse.status === 'fulfilled' ? (conventionsResponse.value.data?.length || 0) : 0;
        
        setStats({
          itemsCount,
          categoriesCount,
          locationsCount,
          conventionsCount
        });
        
        // Process notifications separately since they may fail
        if (notificationsResponse.status === 'fulfilled' && notificationsResponse.value.data) {
          const unreadCount = notificationsResponse.value.data.filter(n => !n.read).length;
          setUnreadNotifications(unreadCount);
          
          // Log success for debugging
          logDebug('Successfully fetched notifications', {
            total: notificationsResponse.value.data.length,
            unread: unreadCount
          }, 'info');
        } else if (notificationsResponse.status === 'rejected') {
          // Log error for debugging
          logDebug('Failed to fetch notifications', 
            notificationsResponse.reason, 
            'error'
          );
        }
      } catch (error) {
        logDebug('Error fetching dashboard stats:', error, 'error');
        setError('Unable to load dashboard data. Please try again.');
        // We still want to show the dashboard even if stats fail to load
        // Only retry a few times to avoid infinite loops
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000); // Wait 2 seconds before retrying
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [currentAssociation, user, retryCount, safeSelect]);
  
  // Separate effect for notification subscription
  useEffect(() => {
    if (!user) return;
    
    // Set up real-time notifications subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // On notification change, just update the unread count
          safeSelect('notifications', '*', {
            column: 'user_id',
            value: user.id
          }).then(({ data }) => {
            if (data) {
              const unreadCount = data.filter(n => !n.read).length;
              setUnreadNotifications(unreadCount);
              logDebug('Updated notification count via realtime', { unreadCount }, 'info');
            }
          }).catch(error => {
            logDebug('Error updating notification count:', error, 'error');
          });
        }
      )
      .subscribe();
    
    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, safeSelect]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };
  
  if (associationLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="xl" loadingText="Loading your dashboard..." />
      </div>
    );
  }

  if (!currentAssociation) {
    return <NoAssociationView />;
  }

  if (showLocationManager && currentAssociation) {
    return (
      <LocationManagerView 
        onBack={() => setShowLocationManager(false)} 
        currentAssociation={currentAssociation} 
      />
    );
  }

  const isHome = location.pathname === "/dashboard";

  return (
    <div className="space-y-6">
      <DashboardHeader 
        currentAssociation={currentAssociation} 
        user={user} 
        isHome={isHome} 
      />

      {/* Stats Cards */}
      <DashboardStats 
        stats={stats} 
        isLoading={isLoading} 
        error={error} 
        onRetry={handleRetry} 
      />

      {/* Association Management Module */}
      <AssociationManagementSection onShowLocationManager={() => setShowLocationManager(true)} />

      {/* Convention Management Module */}
      <ConventionManagementSection />

      {/* Communication Module */}
      <CommunicationSection unreadNotifications={unreadNotifications} />
    </div>
  );
};

export default Dashboard;
