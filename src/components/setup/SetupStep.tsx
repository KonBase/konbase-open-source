
import React from 'react';
import { Button } from '@/components/ui/button';

export interface SetupStepProps extends React.HTMLAttributes<HTMLDivElement> {
  onSuccess?: () => void;
  children?: React.ReactNode;
}

const SetupStep: React.FC<SetupStepProps> = ({
  onSuccess,
  children,
  ...props
}) => {
  const handleComplete = () => {
    if (onSuccess) onSuccess();
  };

  return (
    <div {...props}>
      {children}
      <Button 
        variant="outline" 
        onClick={handleComplete}
        className="mt-4"
      >
        Complete Setup
      </Button>
    </div>
  );
};

export default SetupStep;
