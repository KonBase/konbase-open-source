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

};