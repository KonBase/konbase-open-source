
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug, RefreshCw, Wifi } from 'lucide-react';
import { enableDebugMode, logDebug } from '@/utils/debug';

interface DebugActionButtonsProps {
  onRetry?: () => void;
  testConnection?: () => Promise<boolean | null>;
  isTestingConnection?: boolean;
}

export const DebugActionButtons: React.FC<DebugActionButtonsProps> = ({
  onRetry,
  testConnection,
  isTestingConnection
}) => {
  const handleEnableDebugMode = () => {
    enableDebugMode(true);
    logDebug('Debug mode enabled via debug panel', null, 'info');
  };
  
  const handleTestConnection = async () => {
    if (!testConnection || isTestingConnection) return;
    
    try {
      const result = await testConnection();
      logDebug('Manual connection test result', { success: result }, 'info');
    } catch (error) {
      logDebug('Manual connection test error', error, 'error');
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      {onRetry && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onRetry} 
          className="h-7 text-xs"
          disabled={isTestingConnection}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isTestingConnection ? 'animate-spin' : ''}`} /> 
          Retry
        </Button>
      )}
      {testConnection && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleTestConnection} 
          disabled={isTestingConnection}
          className="h-7 text-xs"
        >
          <Wifi className="h-3 w-3 mr-1" /> 
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={handleEnableDebugMode} className="h-7 text-xs">
        <Bug className="h-3 w-3 mr-1" /> Enable Debug Mode
      </Button>
    </div>
  );
};

export default DebugActionButtons;
