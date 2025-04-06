
import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardOverviewSection from '@/components/dashboard/DashboardOverviewSection';
import AssociationManagementSection from '@/components/dashboard/AssociationManagementSection';
import ConventionManagementSection from '@/components/dashboard/ConventionManagementSection';
import CommunicationSection from '@/components/dashboard/CommunicationSection';
import MemberManager from '@/components/association/MemberManager';
import DashboardDebugPanel from '@/components/dashboard/DashboardDebugPanel';
import { Association } from '@/types/association';
import { User } from '@/types/user';

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  entity: string;
  entity_id: string;
}

interface DashboardContentProps {
  currentAssociation: Association;
  user: User | null;
  isLoadingActivity: boolean;
  safeRecentActivity: AuditLog[];
  activityError: any;
  handleRetry: () => void;
  onShowLocationManager: () => void;
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  networkStatus: any;
  lastError: any;
  retryCount: number;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  currentAssociation,
  user,
  isLoadingActivity,
  safeRecentActivity,
  activityError,
  handleRetry,
  onShowLocationManager,
  isDebugMode,
  toggleDebugMode,
  networkStatus,
  lastError,
  retryCount
}) => {
  const isHome = true;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-8">
        <DashboardHeader 
          currentAssociation={currentAssociation} 
          user={user} 
          isHome={isHome} 
        />

        <ErrorBoundary>
          <DashboardOverviewSection 
            currentAssociation={currentAssociation}
            isLoadingActivity={isLoadingActivity}
            recentActivity={safeRecentActivity}
            activityError={activityError}
            handleRetry={handleRetry}
          />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <AssociationManagementSection onShowLocationManager={onShowLocationManager} />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <ConventionManagementSection />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <CommunicationSection unreadNotifications={0} />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <div className="py-6">
            <MemberManager minimal />
          </div>
        </ErrorBoundary>
        
        <DashboardDebugPanel 
          isDebugMode={isDebugMode}
          toggleDebugMode={toggleDebugMode}
          networkStatus={networkStatus}
          user={user}
          currentAssociation={currentAssociation}
          lastError={lastError}
          handleRetry={handleRetry}
          retryCount={retryCount}
        />
      </div>
    </div>
  );
};

export default DashboardContent;
