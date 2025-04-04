
import RegisterForm from '@/components/auth/RegisterForm';
import { ScrollArea } from '@/components/ui/scroll-area';

const Register = () => {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <div className="hidden lg:flex flex-1 bg-primary/10 items-center justify-center p-8">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6 text-primary">EventNexus Supply Chain</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Join thousands of convention organizers and fantasy clubs managing their inventory efficiently.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Work together with your team members through role-based permissions.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                  <path d="M12 6h.01" />
                  <path d="M12 10h.01" />
                  <path d="M12 14h.01" />
                  <path d="M12 18h.01" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Comprehensive Logging</h3>
                <p className="text-sm text-muted-foreground">
                  Track all equipment movements with detailed audit logs and history.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Enhanced Security</h3>
                <p className="text-sm text-muted-foreground">
                  Role-based access control and two-factor authentication for sensitive operations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-8 flex items-center justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">EventNexus</h1>
            <p className="text-muted-foreground">Supply Chain Management</p>
          </div>
          <RegisterForm />
        </div>
      </ScrollArea>
    </div>
  );
};

export default Register;
