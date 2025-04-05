
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

const Dashboard = () => {
  const { user } = useAuth();
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const location = useLocation();
  const navigate = useNavigate();
  const { safeSelect } = useTypeSafeSupabase();
  
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

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!currentAssociation || !user) return;
      
      setIsLoading(true);
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
            value: user.id 
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
        }
      } catch (error) {
        logDebug('Error fetching dashboard stats:', error, 'error');
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
    
    // Set up subscription for notifications - using a more resilient approach
    const setupNotificationsSubscription = async () => {
      if (!user) return null;
      
      try {
        const notificationsChannel = useTypeSafeSupabase().supabase
          .channel('notifications-changes-dashboard')
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
                }
              }).catch(error => {
                logDebug('Error updating notification count:', error, 'error');
              });
            }
          )
          .subscribe((status) => {
            logDebug(`Notification subscription status: ${status}`, null, 'info');
          });
          
        return notificationsChannel;
      } catch (error) {
        logDebug('Error setting up notifications subscription:', error, 'error');
        return null;
      }
    };
    
    const notificationsChannel = setupNotificationsSubscription();
        
    return () => {
      if (notificationsChannel) {
        useTypeSafeSupabase().supabase.removeChannel(notificationsChannel);
      }
    };
  }, [currentAssociation, user, retryCount]);
  
  if (associationLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
      <DashboardStats stats={stats} isLoading={isLoading} />

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
