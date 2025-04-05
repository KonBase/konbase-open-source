
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { ShieldAlert, KeyRound } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SuperAdminElevationButton() {
  const { userProfile, elevateToSuperAdmin } = useAuth();
  const [isElevating, setIsElevating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  // Only system_admin users without super_admin access already can elevate
  const canElevate = userProfile?.role === 'system_admin';
  
  const handleElevation = async () => {
    try {
      setIsElevating(true);
      const result = await elevateToSuperAdmin();
      
      if (result.success) {
        toast({
          title: "Super Admin Activated",
          description: "You now have Super Admin privileges for this session.",
          variant: "success"
        });
        setShowDialog(false);
      } else {
        toast({
          title: "Elevation Failed",
          description: result.message || "Could not elevate to Super Admin",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error during elevation:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsElevating(false);
    }
  };
  
  if (!canElevate) return null;
  
  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Elevate to Super Admin</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Elevate to Super Admin</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to elevate your privileges to Super Admin level. This will grant you full access to all system settings and sensitive operations.
            {!userProfile?.two_factor_enabled && (
              <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    Two-Factor Authentication is required for Super Admin access.
                  </p>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleElevation}
            disabled={isElevating || !userProfile?.two_factor_enabled}
            className={!userProfile?.two_factor_enabled ? 
              "bg-gray-400 text-gray-700 hover:bg-gray-400 cursor-not-allowed" : 
              "bg-amber-600 hover:bg-amber-700 text-white"}
          >
            {isElevating ? "Elevating..." : "Confirm Elevation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
