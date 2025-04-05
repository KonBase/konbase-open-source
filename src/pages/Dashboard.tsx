
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'react-router-dom';

// Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import NoAssociationView from '@/components/dashboard/NoAssociationView';
import AssociationManagementSection from '@/components/dashboard/AssociationManagementSection';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import CommunicationSection from '@/components/dashboard/CommunicationSection';
import LocationManagerView from '@/components/dashboard/LocationManagerView';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const location = useLocation();
  
  const [stats, setStats] = useState({
    itemsCount: 0,
    categoriesCount: 0,
    locationsCount: 0,
    conventionsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showLocationManager, setShowLocationManager] = useState(false);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!currentAssociation) return;
      
      setIsLoading(true);
      try {
        // Fetch items count
        const { count: itemsCount, error: itemsError } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id);
        
        // Fetch categories count
        const { count: categoriesCount, error: categoriesError } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id);
        
        // Fetch locations count
        const { count: locationsCount, error: locationsError } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id);
        
        // Fetch conventions count
        const { count: conventionsCount, error: conventionsError } = await supabase
          .from('conventions')
          .select('*', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id);
        
        // Fetch unread notifications count
        const { count: notificationsCount, error: notificationsError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .eq('read', false);
        
        if (itemsError || categoriesError || locationsError || conventionsError || notificationsError) {
          console.error("Error fetching stats:", { 
            itemsError, categoriesError, locationsError, conventionsError, notificationsError 
          });
          return;
        }
        
        setStats({
          itemsCount: itemsCount || 0,
          categoriesCount: categoriesCount || 0,
          locationsCount: locationsCount || 0,
          conventionsCount: conventionsCount || 0
        });
        
        setUnreadNotifications(notificationsCount || 0);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
    
    // Set up subscription for notifications
    if (user) {
      const notificationsChannel = supabase
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
            // Refresh unread notifications count
            supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('read', false)
              .then(({ count }) => {
                setUnreadNotifications(count || 0);
              });
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(notificationsChannel);
      };
    }
  }, [currentAssociation, user]);
  
  if (associationLoading || isLoading) {
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
