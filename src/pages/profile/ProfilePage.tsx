
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, AlertTriangle, Building, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, updateProfile, refreshProfile, loading } = useUserProfile();
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>Unable to load your profile information.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setUploading(true);
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: publicURL } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      if (!publicURL) throw new Error('Failed to get public URL');
      
      // Update profile
      const { success, error } = await updateProfile({
        profile_image: publicURL.publicUrl
      });
      
      if (!success) throw error;
      
      await refreshProfile();
      
      toast({
        title: "Avatar Updated",
        description: "Your profile image has been updated successfully."
      });
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile image.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSavingProfile(true);
      
      const { success, error } = await updateProfile({
        name,
        email
      });
      
      if (!success) throw new Error(error);
      
      await refreshProfile();
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully."
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      
      // Delete user account from Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (error) throw error;
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted."
      });
      
      // Sign out and redirect to home page
      await signOut();
      navigate('/');
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete your account.",
        variant: "destructive"
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  // Format the created date for display
  const memberSince = new Date(profile.created_at).toLocaleDateString();
  
  // Get the first letter of the name for avatar fallback
  const nameLetter = name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';
  
  // Role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'manager':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'member':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="info">Personal Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="association">Association</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your profile picture</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.profile_image || undefined} />
                  <AvatarFallback className="text-4xl">{nameLetter}</AvatarFallback>
                </Avatar>
                
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-md">
                      {uploading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Upload new image</span>
                        </>
                      )}
                    </div>
                    <input 
                      id="avatar-upload" 
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </Label>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <Badge className={getRoleBadgeColor(profile.role)}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-center">
                <p className="text-xs text-muted-foreground">
                  Member since {memberSince}
                </p>
                
                <div className="text-xs text-muted-foreground mt-1">
                  User ID: {profile.id.substring(0, 8)}...
                </div>
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                    />
                  </div>
                  
                  <div className="grid gap-3">
                    <Label>Association</Label>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {currentAssociation ? (
                        <span>{currentAssociation.name}</span>
                      ) : (
                        <span className="text-muted-foreground">Not associated with any organization</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleUpdateProfile} disabled={savingProfile}>
                  {savingProfile ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      {profile.two_factor_enabled ? (
                        <span className="text-green-500">Enabled</span>
                      ) : (
                        <span className="text-amber-500">Disabled</span>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => navigate('/settings')}>
                      {profile.two_factor_enabled ? 'Manage 2FA' : 'Enable 2FA'}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Password</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update your password regularly to keep your account secure.
                  </p>
                  <Button variant="outline" onClick={() => navigate('/settings')}>
                    Change Password
                  </Button>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-red-500 flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete My Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deletingAccount}
                        >
                          {deletingAccount ? (
                            <>
                              <Loader2 className="animate-spin h-4 w-4 mr-2" />
                              Deleting...
                            </>
                          ) : (
                            'Delete Account'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Security Tips</CardTitle>
                <CardDescription>Keep your account safe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Use a strong password</h4>
                  <p className="text-sm text-muted-foreground">
                    Create a unique password with at least 12 characters, including numbers, symbols, and mixed case letters.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Enable two-factor authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to prevent unauthorized access to your account.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Be cautious with third-party access</h4>
                  <p className="text-sm text-muted-foreground">
                    Only grant access to trusted applications and regularly review connected apps.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="association">
          <Card>
            <CardHeader>
              <CardTitle>Association Information</CardTitle>
              <CardDescription>
                Details about your current association
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentAssociation ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">{currentAssociation.name}</h3>
                      <p className="text-muted-foreground">
                        {currentAssociation.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Contact Information</h4>
                      <p className="text-sm">Email: {currentAssociation.contactEmail}</p>
                      {currentAssociation.contactPhone && (
                        <p className="text-sm">Phone: {currentAssociation.contactPhone}</p>
                      )}
                    </div>
                    
                    {currentAssociation.website && (
                      <div>
                        <h4 className="font-medium">Website</h4>
                        <p className="text-sm">{currentAssociation.website}</p>
                      </div>
                    )}
                  </div>
                  
                  {currentAssociation.address && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium">Address</h4>
                        <p className="text-sm whitespace-pre-line">{currentAssociation.address}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">No Association</h3>
                    <p className="text-muted-foreground">You are not currently a member of any association.</p>
                  </div>
                  <Button onClick={() => navigate('/setup')}>Create or Join Association</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
