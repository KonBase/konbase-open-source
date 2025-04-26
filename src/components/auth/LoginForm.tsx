import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logDebug, handleError } from '@/utils/debug';
import { getLastVisitedPath } from '@/utils/session-utils';

const LoginForm = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const { login, signInWithOAuth, userProfile, loading: authLoading } = useAuth();
  const [isReady] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const emailVerificationNeeded = location.state?.emailVerification;
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (redirectTo && isReady && !authLoading && userProfile) {
      logDebug('Redirecting based on role', { role: userProfile.role, path: redirectTo }, 'info');
      navigate(redirectTo, { replace: true });
      setRedirectTo(null);
    } else if (redirectTo && isReady && !authLoading && !userProfile) {
      logDebug('User profile not found after login, redirecting to dashboard', null, 'warn');
      navigate('/dashboard', { replace: true }); 
      setRedirectTo(null);
    }
  }, [redirectTo, userProfile, authLoading, isReady, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      logDebug('Login attempt', { email }, 'info');
      
      await login(email, password);
      
      toast({
        title: 'Login successful',
        description: 'Welcome back! Redirecting...',
      });

      if (location.state?.from) {
        setRedirectTo(location.state.from);
      } else {
        setRedirectTo(getLastVisitedPath() || '/dashboard');
      }
    } catch (error: any) {
      handleError(error, 'LoginForm.handleSubmit');
      
      if (error.message?.includes('email') && error.message?.includes('verification')) {
        toast({
          title: "Email verification required",
          description: "Please check your inbox and verify your email before logging in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: 'Login failed',
          description: error.message || 'Invalid email or password.',
          variant: 'destructive',
        });
      }
      
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      logDebug('Google sign in attempt', null, 'info');
      await signInWithOAuth('google');
    } catch (error: any) {
      handleError(error, 'LoginForm.handleGoogleSignIn');
      setIsGoogleLoading(false);
    }
  };
  
  const handleDiscordLogin = async () => {
    try {
      setIsDiscordLoading(true);
      logDebug('Discord sign in attempt', null, 'info');
      await signInWithOAuth('discord');
    } catch (error: any) {
      handleError(error, 'LoginForm.handleDiscordLogin');
      setIsDiscordLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Login</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {emailVerificationNeeded && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Email Verification Pending</AlertTitle>
              <AlertDescription>
                Please check your email inbox (and spam folder) to verify your account before logging in.
              </AlertDescription>
            </Alert>
          )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m@example.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading || isDiscordLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading || isDiscordLoading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember-me" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              disabled={isLoading || isGoogleLoading || isDiscordLoading}
            />
            <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || isDiscordLoading}>
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Login
          </Button>
        </form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading || isDiscordLoading}>
            {isGoogleLoading ? <Spinner size="sm" className="mr-2" /> : null} Google
          </Button>
          <Button variant="outline" onClick={handleDiscordLogin} disabled={isLoading || isGoogleLoading || isDiscordLoading}>
            {isDiscordLoading ? <Spinner size="sm" className="mr-2" /> : null} Discord
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-center block">
        Don't have an account?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;
