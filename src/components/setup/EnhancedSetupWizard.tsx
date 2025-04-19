import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EnhancedSetupSteps from './EnhancedSetupSteps';
import { useNavigate } from 'react-router-dom';
import { isConfigured } from '@/lib/config-store'; // Import isConfigured

const EnhancedSetupWizard = () => {
  const navigate = useNavigate();
  const configured = isConfigured(); // Use isConfigured

  useEffect(() => {
    // If already configured, redirect away from setup
    if (configured) {
      console.log('Already configured, redirecting to dashboard.');
      navigate('/dashboard', { replace: true });
    }
  }, [configured, navigate]);

  // Don't render the wizard if already configured (avoids flash of content)
  if (configured) {
    return null; 
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">KonBase Setup Wizard</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedSetupSteps />
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSetupWizard;
