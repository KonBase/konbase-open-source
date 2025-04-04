
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAssociation } from '@/contexts/AssociationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const SetupWizard = () => {
  const [step, setStep] = useState(1);
  const [associationName, setAssociationName] = useState('');
  const [associationDescription, setAssociationDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createAssociation } = useAssociation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleNext = () => {
    setStep(current => current + 1);
  };
  
  const handleBack = () => {
    setStep(current => current - 1);
  };
  
  const handleSubmit = async () => {
    if (!associationName.trim()) {
      toast({
        title: 'Association name required',
        description: 'Please enter a name for your association.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const association = await createAssociation({
        name: associationName,
        description: associationDescription,
        contactEmail: contactEmail || user?.email || ''
      });
      
      if (association) {
        toast({
          title: 'Setup complete!',
          description: 'Your association has been created successfully.',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error during setup:', error);
      toast({
        title: 'Setup failed',
        description: 'There was an error creating your association. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to EventNexus Supply!</CardTitle>
          <CardDescription>
            {step === 1 && "Let's get you started with your account setup."}
            {step === 2 && "Tell us about your association."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Account Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Your account has been created. Now let's set up your association.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Your account details
                      </h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                        <p>Name: {user?.name}</p>
                        <p>Email: {user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="associationName">Association Name</Label>
                <Input 
                  id="associationName"
                  value={associationName}
                  onChange={e => setAssociationName(e.target.value)}
                  placeholder="Enter your association name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="associationDescription">Description</Label>
                <Textarea 
                  id="associationDescription"
                  value={associationDescription}
                  onChange={e => setAssociationDescription(e.target.value)}
                  placeholder="Briefly describe your association"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input 
                  id="contactEmail"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder={user?.email || "Enter contact email"}
                  type="email"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use your account email
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={isCreating}>
              Back
            </Button>
          ) : (
            <div></div>
          )}
          
          {step < 2 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? "Creating..." : "Complete Setup"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default SetupWizard;
