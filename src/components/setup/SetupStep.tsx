
import React from 'react';

export interface SetupStepProps {
  onSuccess?: () => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({
  onSuccess,
}) => {
  const handleComplete = () => {
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex flex-col space-y-4">
      <p className="text-sm text-muted-foreground">
        Your setup is almost complete. Once you've created or joined an association, you'll be redirected to the dashboard.
      </p>
      <div className="flex justify-end">
        <button 
          onClick={handleComplete}
          className="text-sm text-primary hover:underline"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
};

export default SetupStep;
