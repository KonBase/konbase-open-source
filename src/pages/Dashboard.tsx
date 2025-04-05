import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { useLocation } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';

// Dashboard Components
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import NoAssociationView from '@/components/dashboard/NoAssociationView';
import AssociationManagementSection from '@/components/dashboard/AssociationManagementSection';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import CommunicationSection from '@/components/dashboard/CommunicationSection';
import LocationManagerView from '@/components/dashboard/LocationManagerView';
import DashboardRedirectHandler from '@/components/dashboard/DashboardRedirectHandler';
import { Spinner } from '@/components/ui/spinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const location = useLocation();
  const [showLocationManager, setShowLocationManager] = useState(false);
  
  const {
    stats,
    isLoading,
    error,
    handleRetry,
    unreadNotifications
  } = useDashboardStats(currentAssociation, user);
  
  // Handle redirects from query parameters
  <DashboardRedirectHandler />
  
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
