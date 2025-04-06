
import React from 'react';

export interface SetupStepProps {
  onSuccess?: () => void;
  children?: React.ReactNode;
}

const SetupStep: React.FC<SetupStepProps> = ({
  onSuccess,
  children
}) => {
  const handleComplete = () => {
    if (onSuccess) onSuccess();
  };

  return (
    <div>
      {children}
      <button onClick={handleComplete}>Complete Setup</button>
    </div>
  );
};

export default SetupStep;
