import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { isConfigured, setConfig, getConfig } from '@/lib/config-store';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reinitializeClient } = useAuth(); // Get reinitializeClient from context
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already configured
  useEffect(() => {
    if (isConfigured()) {
      // Maybe redirect to dashboard or login if already set up?
      // navigate('/dashboard'); 
      // Or show a message indicating it's already configured.
      toast({ title: "Setup Already Completed", description: "Redirecting to dashboard..." });
      // Small delay to allow toast to show
      setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
    }
  }, [navigate, toast]);

  const handleTestAndSave = async () => {
    setIsLoading(true);
    try {
      // Basic validation
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL and Anon Key are required.');
      }

      // Attempt to create a temporary client to test the connection
      const tempClient = createClient(supabaseUrl, supabaseAnonKey);
      
      // Try a simple query, e.g., fetching user (even if null)
      // This validates the URL and Key are likely correct and reachable
      const { data, error } = await tempClient.auth.getUser();

      // Check for specific auth errors indicating bad credentials/URL
      if (error && error.message.includes('Invalid API key')) {
          throw new Error('Invalid Supabase Anon Key.');
      }
      if (error && error.message.includes('failed to fetch')) {
          throw new Error('Failed to connect to Supabase URL. Check network or URL.');
      }
      // Handle other potential errors during the test connection
      if (error && error.status !== 401) { // Ignore 401 Unauthorized as it means connection worked but no user logged in
          throw error;
      }

      // If the test passes (or results in expected non-critical errors like 401)
      setConfig({ supabaseUrl, supabaseAnonKey });
      toast({
        title: 'Configuration Saved',
        description: 'Supabase connection details saved successfully.',
      });

      // Reinitialize the main Supabase client in AuthContext
      reinitializeClient();

      // Redirect to login or dashboard after successful setup
      // Use replace to prevent going back to the setup wizard
      navigate('/login', { replace: true }); 

    } catch (error: any) {
      console.error("Setup error:", error);
      toast({
        title: 'Connection Test Failed',
        description: error.message || 'Could not connect to Supabase. Please check details and network.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        {/* ... CardHeader, CardContent with Inputs ... */}
         <CardHeader>
          <CardTitle>Konbase Setup</CardTitle>
          <CardDescription>Enter your Supabase connection details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabaseUrl">Supabase URL</Label>
            <Input 
              id="supabaseUrl" 
              placeholder="https://your-project-ref.supabase.co" 
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supabaseAnonKey">Supabase Anon Key</Label>
            <Input 
              id="supabaseAnonKey" 
              type="password" // Use password type for keys
              placeholder="your-anon-key" 
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleTestAndSave} disabled={isLoading} className="w-full">
            {isLoading ? 'Testing & Saving...' : 'Test Connection & Save'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SetupWizard;
