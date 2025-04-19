import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define props including the new callback
export interface SupabaseConnectionFormProps {
  // Renamed from onComplete, now passes credentials on success
  onSuccess: (url: string, key: string) => void; 
  // Keep onNext if the parent stepper uses it, or remove if onSuccess handles progression
  onNext: () => void; 
}

const SupabaseConnectionForm: React.FC<SupabaseConnectionFormProps> = ({ onSuccess, onNext }) => {
  // Log the received onSuccess prop on component render
  console.log('SupabaseConnectionForm rendered. Type of onSuccess:', typeof onSuccess, 'Value:', onSuccess);

  const { toast } = useToast();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testedSuccessfully, setTestedSuccessfully] = useState(false); // Track successful test
  const [testError, setTestError] = useState<string | null>(null); // Track test error message

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestedSuccessfully(false); // Reset success state on new test
    setTestError(null); // Reset error state
    try {
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL and Anon Key are required.');
      }

      // Attempt to create a client - this validates basic URL/key format
      createClient(supabaseUrl, supabaseAnonKey);

      // If createClient didn't throw, assume basic validity for setup
      console.log('Supabase client initialized successfully (basic check).');
      setTestedSuccessfully(true);
      toast({
        title: 'Connection Test Successful',
        description: 'Supabase connection details seem valid.',
      });

      // Call the success callback with the validated credentials, ensuring it exists
      if (typeof onSuccess === 'function') {
        onSuccess(supabaseUrl, supabaseAnonKey);
      } else {
        console.error('onSuccess prop is not a function inside handleTestConnection');
        // Optionally throw an error or show a toast if this is unexpected
        toast({
          title: 'Setup Error',
          description: 'Could not communicate success back to the setup process.',
          variant: 'destructive',
        });
      }

    } catch (error: any) {
      console.error("Connection test error:", error);
      const errorMessage = error.message || 'Could not initialize Supabase client. Please check URL and Key format.';
      setTestError(errorMessage);
      toast({
        title: 'Connection Test Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Connection</CardTitle>
        <CardDescription>Enter your Supabase project URL and Anon Key.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="supabaseUrl">Supabase URL</Label>
          <Input 
            id="supabaseUrl" 
            placeholder="https://your-project-ref.supabase.co" 
            value={supabaseUrl}
            onChange={(e) => { setSupabaseUrl(e.target.value); setTestedSuccessfully(false); setTestError(null); }} // Reset test status on change
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supabaseAnonKey">Supabase Anon Key</Label>
          <Input 
            id="supabaseAnonKey" 
            type="password"
            placeholder="your-anon-key" 
            value={supabaseAnonKey}
            onChange={(e) => { setSupabaseAnonKey(e.target.value); setTestedSuccessfully(false); setTestError(null); }} // Reset test status on change
            disabled={isLoading}
          />
        </div>

         {/* Test Button and Status Indicators */}
         <div className="flex items-center space-x-2 pt-2">
           <Button type="button" onClick={handleTestConnection} disabled={isLoading || !supabaseUrl || !supabaseAnonKey}>
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
             Test Connection
           </Button>
           {testedSuccessfully && !testError && <CheckCircle className="h-5 w-5 text-green-500" />}
           {testError && <AlertCircle className="h-5 w-5 text-destructive" />}
         </div>

         {/* Display Test Error */}
         {testError && (
           <Alert variant="destructive" className="mt-2">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Connection Failed</AlertTitle>
             <AlertDescription>{testError}</AlertDescription>
           </Alert>
         )}
         {/* Display Test Success */}
         {testedSuccessfully && !testError && (
            <Alert variant="success" className="mt-2">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Connection Successful</AlertTitle>
              <AlertDescription>Credentials are valid. You can now continue.</AlertDescription>
            </Alert>
         )}

      </CardContent>
      <CardFooter className="flex justify-end">
         {/* Continue button, enabled only after successful test */}
         <Button onClick={onNext} disabled={!testedSuccessfully || isLoading}>
           Continue
         </Button>
      </CardFooter>
    </Card>
  );
};

export default SupabaseConnectionForm;
