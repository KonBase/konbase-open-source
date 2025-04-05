
import React from 'react';

interface SetupHeaderProps {
  title?: string;
  subtitle?: string;
}

const SetupHeader: React.FC<SetupHeaderProps> = ({ 
  title = "Welcome to KonBase", 
  subtitle = "Get started by creating a new association or joining with an invitation code" 
}) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
};

export default SetupHeader;
