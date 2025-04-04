
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Package, 
  Users, 
  FileBox, 
  MapPin, 
  Calendar, 
  FileText,
  BarChart3,
  ArrowUpDown,
  FileWarning,
  ArchiveIcon,
  BoxIcon,
  FileUp,
  FileDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentAssociation, isLoading: associationLoading } = useAssociation();
  const [stats, setStats] = useState({
    itemsCount: 0,
    categoriesCount: 0,
    locationsCount: 0,
    conventionsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!currentAssociation) return;
      
      setIsLoading(true);
      try {
        // Fetch items count
        const { count: itemsCount, error: itemsError } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id);
        
        // Fetch categories count
        const { count: categoriesCount, error: categoriesError } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id);
        
        // Fetch locations count
        const { count: locationsCount, error: locationsError } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id);
        
        // Fetch conventions count
        const { count: conventionsCount, error: conventionsError } = await supabase
          .from('conventions')
          .select('*', { count: 'exact', head: true })
          .eq('association_id', currentAssociation.id);
        
        if (itemsError || categoriesError || locationsError || conventionsError) {
          console.error("Error fetching stats:", { 
            itemsError, categoriesError, locationsError, conventionsError 
          });
          return;
        }
        
        setStats({
          itemsCount: itemsCount || 0,
          categoriesCount: categoriesCount || 0,
          locationsCount: locationsCount || 0,
          conventionsCount: conventionsCount || 0
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [currentAssociation]);
  
  if (associationLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentAssociation) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to EventNexus</CardTitle>
            <CardDescription>You need to set up your association first</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">To get started with EventNexus, you need to create or join an association.</p>
            <Button asChild>
              <Link to="/setup">Set Up Association</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || 'User'}! Here's an overview of {currentAssociation.name}.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itemsCount}</div>
            <p className="text-xs text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FileBox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categoriesCount}</div>
            <p className="text-xs text-muted-foreground">Item categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locationsCount}</div>
            <p className="text-xs text-muted-foreground">Storage locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conventions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conventionsCount}</div>
            <p className="text-xs text-muted-foreground">Total conventions</p>
          </CardContent>
        </Card>
      </div>

      {/* Association Management Module */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Association Management</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/association/profile" className="block p-6">
              <div className="flex items-center space-x-4">
                <Building2 className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Association Profile</h3>
                  <p className="text-sm text-muted-foreground">Manage association details</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/inventory/items" className="block p-6">
              <div className="flex items-center space-x-4">
                <Package className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Inventory</h3>
                  <p className="text-sm text-muted-foreground">Manage your equipment</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/association/members" className="block p-6">
              <div className="flex items-center space-x-4">
                <Users className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-sm text-muted-foreground">Manage members and permissions</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/inventory/categories" className="block p-6">
              <div className="flex items-center space-x-4">
                <FileBox className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Categories</h3>
                  <p className="text-sm text-muted-foreground">Manage item categories</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/inventory/locations" className="block p-6">
              <div className="flex items-center space-x-4">
                <MapPin className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Locations</h3>
                  <p className="text-sm text-muted-foreground">Manage storage locations</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/inventory/sets" className="block p-6">
              <div className="flex items-center space-x-4">
                <BoxIcon className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Equipment Sets</h3>
                  <p className="text-sm text-muted-foreground">Manage predefined sets</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/inventory/warranties" className="block p-6">
              <div className="flex items-center space-x-4">
                <FileWarning className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Warranties</h3>
                  <p className="text-sm text-muted-foreground">Track warranties and docs</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/inventory/import-export" className="block p-6">
              <div className="flex items-center space-x-4">
                <ArrowUpDown className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Import/Export</h3>
                  <p className="text-sm text-muted-foreground">Data import and export</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/settings/backup" className="block p-6">
              <div className="flex items-center space-x-4">
                <ArchiveIcon className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Backups</h3>
                  <p className="text-sm text-muted-foreground">Manage local backups</p>
                </div>
              </div>
            </Link>
          </Card>
        </div>
      </div>

      {/* Convention Management Module */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Convention Management</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/conventions" className="block p-6">
              <div className="flex items-center space-x-4">
                <Calendar className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Conventions</h3>
                  <p className="text-sm text-muted-foreground">Manage conventions</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/conventions/equipment" className="block p-6">
              <div className="flex items-center space-x-4">
                <ArrowUpDown className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Equipment Tracking</h3>
                  <p className="text-sm text-muted-foreground">Issue and return equipment</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/conventions/consumables" className="block p-6">
              <div className="flex items-center space-x-4">
                <Package className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Consumables</h3>
                  <p className="text-sm text-muted-foreground">Track consumable items</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/conventions/locations" className="block p-6">
              <div className="flex items-center space-x-4">
                <MapPin className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Room Mapping</h3>
                  <p className="text-sm text-muted-foreground">Manage convention locations</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/conventions/requirements" className="block p-6">
              <div className="flex items-center space-x-4">
                <FileText className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Requirements</h3>
                  <p className="text-sm text-muted-foreground">Manage equipment needs</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/conventions/logs" className="block p-6">
              <div className="flex items-center space-x-4">
                <FileText className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Activity Logs</h3>
                  <p className="text-sm text-muted-foreground">View all convention activities</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/reports" className="block p-6">
              <div className="flex items-center space-x-4">
                <BarChart3 className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Reports</h3>
                  <p className="text-sm text-muted-foreground">Generate reports</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/conventions/archive" className="block p-6">
              <div className="flex items-center space-x-4">
                <ArchiveIcon className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Archiving</h3>
                  <p className="text-sm text-muted-foreground">Archive past conventions</p>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
            <Link to="/templates" className="block p-6">
              <div className="flex items-center space-x-4">
                <FileUp className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Templates</h3>
                  <p className="text-sm text-muted-foreground">Create convention templates</p>
                </div>
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
