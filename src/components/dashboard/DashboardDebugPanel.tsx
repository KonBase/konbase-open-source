
import React from 'react';
import DebugModeToggle from '@/components/dashboard/DebugModeToggle';
import DebugPanel from '@/utils/debug-panel';
import { User } from '@/types/user';
import { Association } from '@/types/association';

interface DashboardDebugPanelProps {
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  networkStatus: any;
  user: User | null;
  currentAssociation: Association | null;
  lastError: any;
  handleRetry: () => void;
  retryCount: number;
}

const DashboardDebugPanel: React.FC<DashboardDebugPanelProps> = ({
  isDebugMode,
  toggleDebugMode,
  networkStatus,
  user,
  currentAssociation,
  lastError,
  handleRetry,
  retryCount
}) => {
  return (
    <div className="mt-8">
      <DebugModeToggle 
        isDebugMode={isDebugMode} 
        toggleDebugMode={toggleDebugMode} 
      />
      
      {isDebugMode && (
        <DebugPanel 
          networkStatus={networkStatus.status}
          testConnection={networkStatus.testConnection}
          isTestingConnection={networkStatus.isTestingConnection}
          lastTestedAt={networkStatus.lastTestedAt}
          testResults={networkStatus.testResults}
          userData={{ 
            userId: user?.id,
            associationId: currentAssociation?.id
          }}
          errorData={lastError}
          onRetry={handleRetry}
          requestInfo={{
            retryCount,
          }}
        />
      )}
    </div>
  );
};

export default DashboardDebugPanel;
