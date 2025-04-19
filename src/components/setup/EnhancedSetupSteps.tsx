import React, { useState, useEffect } from 'react';
import { Stepper, Step, StepLabel, StepContent, Button, Box, Typography } from '@mui/material';
// Import SupabaseConnectionFormProps to use the type
import SupabaseConnectionForm, { SupabaseConnectionFormProps } from './SupabaseConnectionForm';
import DatabaseSchemaSetup from './DatabaseSchemaSetup';
import SuperAdminSetupForm from './SuperAdminSetupForm';
import AssociationSetupForm from './AssociationSetupForm';
import InvitationCodeForm from './InvitationCodeForm';
// Import saveConfig and SupabaseConfig type
import { loadConfig, isConfigured, clearConfig, saveConfig, SupabaseConfig } from '@/lib/config-store';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth for reinitialization

// Define common props expected by the Stepper logic
interface StepComponentProps {
  onNext: () => void;
  onBack: () => void;
  onReset: () => void;
  // Make onSuccess always potentially available in the props type
  onSuccess?: (url: string, key: string) => void;
}

// Define the steps array without casting components initially
const steps = [
  { label: 'Supabase Connection', component: SupabaseConnectionForm },
  { label: 'Database Schema Setup', component: DatabaseSchemaSetup },
  { label: 'Super Admin Setup', component: SuperAdminSetupForm },
  { label: 'First Association Setup', component: AssociationSetupForm },
  { label: 'Invitation Code', component: InvitationCodeForm },
];

interface EnhancedSetupStepsProps {
  initialStep?: number;
}

const EnhancedSetupSteps: React.FC<EnhancedSetupStepsProps> = ({ initialStep = 0 }) => {
  const [activeStep, setActiveStep] = useState(initialStep);
  const [stepsCompleted, setStepsCompleted] = useState<Record<number, boolean>>({});
  // State to hold credentials temporarily from step 0
  const [tempSupabaseConfig, setTempSupabaseConfig] = useState<{ url: string; key: string } | null>(null);
  const { reinitializeClient } = useAuth();

  // Callback for SupabaseConnectionForm to pass credentials
  const handleConnectionSuccess = (url: string, key: string) => {
    console.log('handleConnectionSuccess called in parent with:', url, key);
    setTempSupabaseConfig({ url, key });
    // In this temporary test, we might just log or proceed manually
    // handleNext(); // Don't automatically proceed in this test
  };

  const handleNext = () => {
    // Simplified next logic for testing
    console.log('handleNext called');
    if (tempSupabaseConfig) {
      console.log('Saving config...', tempSupabaseConfig);
      saveConfig({ ...tempSupabaseConfig, configured: false });
      reinitializeClient();
    }
    // setActiveStep(prev => prev + 1); // Don't change step in this test
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    // Optionally clear config if resetting means starting over
    // clearConfig(); // Uncomment if reset should clear stored Supabase config
    setActiveStep(0);
    setStepsCompleted({});
  };

  // --- TEMPORARY SIMPLIFIED RENDER --- 
  // Render only the SupabaseConnectionForm directly to test prop passing
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h5" gutterBottom>Testing SupabaseConnectionForm</Typography>
      <SupabaseConnectionForm
        onSuccess={handleConnectionSuccess} // Pass the callback directly
        onNext={handleNext} // Pass a simplified next handler
      />
      <hr style={{ margin: '20px 0' }} />
      <Typography variant="caption">Stepper logic temporarily disabled for testing.</Typography>
      {/* Original Stepper logic commented out below */}
      {/* 
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => { ... })}
      </Stepper>
      */}
    </Box>
  );
  // --- END TEMPORARY RENDER ---
};

export default EnhancedSetupSteps;
