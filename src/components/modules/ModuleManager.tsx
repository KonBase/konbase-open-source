import React, { useState } from 'react';
import { useModules } from './ModuleContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { AlertCircle, Info, Package } from 'lucide-react';
import { ErrorDetails } from '../../utils/debug/error-details';
import moduleService from './ModuleService';

export const ModuleManager: React.FC = () => {
  const { manifests, refreshModuleState } = useModules();
  const [activeTab, setActiveTab] = useState('installed');
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleModule = async (moduleId: string, currentState: boolean) => {
    setLoading(moduleId);
    setError(null);
    
    try {
      if (currentState) {
        await moduleService.disableModule(moduleId);
      } else {
        await moduleService.enableModule(moduleId);
      }
      refreshModuleState();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Module Management</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="installed">Installed Modules</TabsTrigger>
          <TabsTrigger value="store">Module Store</TabsTrigger>
          <TabsTrigger value="developer">Developer Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="installed">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {manifests.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Modules Installed</CardTitle>
                  <CardDescription>
                    You don't have any modules installed yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Visit the Module Store to browse available modules or check the Developer Resources
                    to learn how to create your own.
                  </p>
                  <Button onClick={() => setActiveTab('store')}>
                    Browse Module Store
                  </Button>
                </CardContent>
              </Card>
            ) : (
              manifests.map(manifest => (
                <Card key={manifest.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{manifest.name}</CardTitle>
                        <CardDescription>v{manifest.version}</CardDescription>
                      </div>
                      <Switch 
                        checked={manifest.isEnabled}
                        disabled={loading === manifest.id}
                        onCheckedChange={() => handleToggleModule(manifest.id, manifest.isEnabled)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {manifest.description || 'No description provided.'}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <p>Author: {manifest.author || 'Unknown'}</p>
                      <p>Installed: {new Date(manifest.installDate).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {error && (
            <div className="mt-6">
              <ErrorDetails errorData={error} />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Module Store</CardTitle>
              <CardDescription>
                Browse and install modules to extend your Konbase functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-6 border border-dashed rounded-md">
                <div className="text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Module Store Coming Soon</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The module store is currently under development. Check back later!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="developer">
          <Card>
            <CardHeader>
              <CardTitle>Developer Resources</CardTitle>
              <CardDescription>
                Learn how to create custom modules for Konbase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Getting Started
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Creating modules for Konbase is straightforward. Follow our documentation to get started.
                  </p>
                  <Button variant="outline" className="mt-2">
                    View Documentation
                  </Button>
                </div>
                
                <div className="p-4 bg-muted rounded-md">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Module Templates
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Start with our module templates to quickly create new modules.
                  </p>
                  <Button variant="outline" className="mt-2">
                    Download Templates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};