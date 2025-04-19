import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { toast } from '@/hooks/use-toast';
import { loadConfig, SupabaseConfig } from '@/lib/config-store';
import { getSupabaseClient } from '@/lib/supabase'; // Keep this import
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, User, Shield } from 'lucide-react';

interface SuperAdminSetupFormProps {
  onNext: () => void; // Changed from onComplete to onNext
}

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof formSchema>;

const SuperAdminSetupForm: React.FC<SuperAdminSetupFormProps> = ({ onNext }) => {
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SupabaseConfig | null>(null);

  useEffect(() => {
    // Load config on mount
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
    if (!loadedConfig?.configured) {
      toast({
        title: "Configuration Error",
        description: "Supabase URL and Key must be configured first.",
        variant: "destructive",
      });
      // Optionally redirect or disable form
    }
  }, []);

  const form = useForm<FormValues>( {
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
  });

  const createSuperAdmin = async (values: FormValues) => {
    // Use config.url and config.key
    if (!config?.url || !config?.key) {
      setError('Supabase credentials not found. Please go back and configure the connection.');
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(false);

    try {
      // Get client using stored credentials (no args needed for getSupabaseClient)
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client. Check configuration.');
      }


      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
          },
        },
      });

      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // 2. Update the user's role to super_admin in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'super_admin',
          name: values.name
        })
        .eq('id', authData.user.id);

      if (profileError) {
        throw new Error(`Profile update error: ${profileError.message}`);
      }

      // Success!
      setSuccess(true);

      // Sign out after creating the admin account
      await supabase.auth.signOut();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error creating super admin');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create Super Admin Account</CardTitle>
        <CardDescription>
          Set up the first administrator account with full system access
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(createSuperAdmin)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    This email will be used to log in to your KonBase system
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Admin User" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormDescription>
                    Must be at least 8 characters long
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Account creation failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Super Admin created successfully!</AlertTitle>
                <AlertDescription>
                  Your admin account is now ready to use.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={creating || success}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Create Super Admin Account
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          This account will have full access to all KonBase features.
        </p>
        <Button
          onClick={onNext} // Changed from onComplete
          disabled={creating || !success}
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuperAdminSetupForm;
