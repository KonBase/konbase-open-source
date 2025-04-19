import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Steps, Step } from '@/components/ui/steps';
import { Loader2, CheckCircle, Database, User, Users, ArrowRight } from 'lucide-react';
// Import necessary functions from config-store
import { isConfigured, loadConfig, saveConfig, SupabaseConfig } from '@/lib/config-store';
import SupabaseConnectionForm from '@/components/setup/SupabaseConnectionForm';
import SuperAdminSetupForm from '@/components/setup/SuperAdminSetupForm';
import AssociationSetupForm from '@/components/setup/AssociationSetupForm';
import DatabaseSchemaSetup from '@/components/setup/DatabaseSchemaSetup';

type SetupStep = 'welcome' | 'supabase' | 'schema' | 'admin' | 'association' | 'complete';

const FirstTimeSetup: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [loading, setLoading] = useState(false);
  // Use isConfigured for the initial check
  const setupAlreadyCompleted = isConfigured(); 
  const navigate = useNavigate();
  
  // Redirect if setup has already been completed
  useEffect(() => {
    if (setupAlreadyCompleted) {
      navigate('/');
    }
  }, [setupAlreadyCompleted, navigate]);
  
  const steps = [
    { id: 'welcome', title: 'Welcome' },
    { id: 'supabase', title: 'Database Connection' },
    { id: 'schema', title: 'Database Schema' },
    { id: 'admin', title: 'Admin Account' },
    { id: 'association', title: 'First Association' },
    { id: 'complete', title: 'Complete' }
  ];
  
  const handleStepComplete = (nextStep: SetupStep) => {
    setCurrentStep(nextStep);
  };

  // Function to mark setup as fully complete
  const handleFinalComplete = () => {
    const currentConfig = loadConfig();
    if (currentConfig) {
      // Update the existing config to mark as fully configured
      const finalConfig: SupabaseConfig = { 
        ...currentConfig, 
        configured: true 
      };
      saveConfig(finalConfig);
      // Potentially reinitialize client one last time if needed, though should be okay
      // useAuth().reinitializeClient(); 
      navigate('/dashboard');
    } else {
      // Handle error - config should exist at this point
      console.error("Error completing setup: Config not found.");
      // Maybe navigate to an error page or back to supabase step?
      setCurrentStep('supabase'); 
    }
  };
  
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <header className="py-6 border-b bg-card">
        <div className="container">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png" 
              alt="KonBase Logo" 
              className="h-10 w-10" 
            />
            <h1 className="text-2xl font-bold">KonBase Setup</h1>
          </div>
        </div>
      </header>
      
      <div className="container max-w-screen-md mx-auto flex-1 p-6">
        <div className="mb-8">
          <Steps currentStep={currentStepIndex} className="mb-8">
            {steps.map((step, index) => (
              <Step 
                key={step.id} 
                title={step.title} 
                description={index < currentStepIndex ? "Completed" : index === currentStepIndex ? "Current" : "Pending"} 
              />
            ))}
          </Steps>
        </div>
        
        {currentStep === 'welcome' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to KonBase</CardTitle>
              <CardDescription>
                Let's set up your KonBase supply management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                This wizard will guide you through the initial setup process. 
                You'll need to:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Database className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Configure Supabase Connection</p>
                    <p className="text-sm text-muted-foreground">Set up your remote database connection</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Database className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Initialize Database Schema</p>
                    <p className="text-sm text-muted-foreground">Create all required tables and functions</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <User className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Create Super Admin Account</p>
                    <p className="text-sm text-muted-foreground">Set up your administrator access</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Create First Association</p>
                    <p className="text-sm text-muted-foreground">Set up your first organization</p>
                  </div>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleStepComplete('supabase')}>
                Begin Setup <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === 'supabase' && (
          <SupabaseConnectionForm 
            onSuccess={(url, key) => handleStepComplete('schema')}
            onNext={() => handleStepComplete('schema')}
          />
        )}

        {currentStep === 'schema' && (
          <DatabaseSchemaSetup onNext={() => handleStepComplete('admin')} />
        )} 
        
        {currentStep === 'admin' && (
          <SuperAdminSetupForm onNext={() => handleStepComplete('association')} />
        )}
        
        {currentStep === 'association' && (
          <AssociationSetupForm onNext={() => handleStepComplete('complete')} />
        )}
        
        {currentStep === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Setup Complete!</CardTitle>
              <CardDescription>
                Your KonBase system is now ready to use
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="mb-6">
                Congratulations! You've successfully set up KonBase. You can now start managing your inventory 
                and organizing your conventions.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleFinalComplete}>
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>KonBase Supply Management System</p>
      </footer>
    </div>
  );
};

export default FirstTimeSetup;
