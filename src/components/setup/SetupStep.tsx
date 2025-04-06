
import React from 'react';

export interface SetupStepProps {
  onSuccess?: () => void;
}

const SetupStep: React.FC<SetupStepProps> = ({
  onSuccess,
}) => {
  const handleComplete = () => {
    if (onSuccess) onSuccess();
  };

  return (
    <div>
      <button onClick={handleComplete}>Complete Setup</button>
    </div>
  );
};

export default SetupStep;
