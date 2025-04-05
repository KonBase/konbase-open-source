
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Plus } from 'lucide-react';

import SetupHeader from '@/components/setup/SetupHeader';
import InvitationCodeForm from '@/components/setup/InvitationCodeForm';
import AssociationForm from '@/components/setup/AssociationForm';

const SetupWizard = () => {
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <SetupHeader />
      
      <Tabs defaultValue="invitation" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="invitation" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Use Invitation Code
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Association
          </TabsTrigger>
        </TabsList>

        {/* Invitation Code Tab */}
        <TabsContent value="invitation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Join with Invitation Code</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InvitationCodeForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Create New Tab */}
        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Association</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <AssociationForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SetupWizard;
