
import React from 'react';

interface DebugModeToggleProps {
  isDebugMode: boolean;
  toggleDebugMode: () => void;
}

const DebugModeToggle: React.FC<DebugModeToggleProps> = ({ 
  isDebugMode, 
  toggleDebugMode 
}) => {
  return (
    <button 
      onClick={toggleDebugMode} 
      className="text-xs text-muted-foreground underline"
    >
      {isDebugMode ? 'Hide' : 'Show'} Debug Information
    </button>
  );
};

export default DebugModeToggle;
