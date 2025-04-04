
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, Calendar, AlertTriangle, ArrowUpFromLine, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentAssociation } = useAssociation();
  
  // Mock data for charts
  const inventoryData = [
    { name: 'Electronics', value: 42 },
    { name: 'Furniture', value: 28 },
    { name: 'Props', value: 35 },
    { name: 'Decor', value: 15 },
    { name: 'Costumes', value: 22 },
  ];
  
  const movementData = [
    { date: 'Jan', checkouts: 20, returns: 15 },
    { date: 'Feb', checkouts: 15, returns: 18 },
    { date: 'Mar', checkouts: 25, returns: 22 },
    { date: 'Apr', checkouts: 30, returns: 28 },
    { date: 'May', checkouts: 18, returns: 20 },
    { date: 'Jun', checkouts: 22, returns: 19 },
  ];
  
  // Mock data for alerts
  const [alerts] = useState([
    { id: 1, message: 'Low stock warning: 5 HDMI cables remaining', priority: 'high' },
    { id: 2, message: 'Equipment maintenance due: Projector #P-1002', priority: 'medium' },
    { id: 3, message: 'Upcoming convention: Fantasy Con 2025 (25 days)', priority: 'low' },
  ]);
  
  // Mock data for recent activities
  const [activities] = useState([
    { id: 1, user: 'John Doe', action: 'checked out 3 speakers', time: '2 hours ago' },
    { id: 2, user: 'Jane Smith', action: 'returned 5 microphones', time: '5 hours ago' },
    { id: 3, user: 'Mike Johnson', action: 'added 10 new badges to inventory', time: '1 day ago' },
    { id: 4, user: 'Sarah Lee', action: 'created a new convention: Board Game Expo', time: '2 days ago' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's an overview of your inventory system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <ArrowUpFromLine className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button size="sm">
            <Truck className="mr-2 h-4 w-4" />
            Manage Inventory
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Items" 
          value="142" 
          description="15 items added this month" 
          icon={<Package className="w-4 h-4" />}
          trend={{ value: 12, positive: true }}
        />
        <StatCard 
          title="Active Members" 
          value="28" 
          description="5 new members this month" 
          icon={<Users className="w-4 h-4" />}
          trend={{ value: 8, positive: true }}
        />
        <StatCard 
          title="Upcoming Events" 
          value="3" 
          description="Next event in 25 days" 
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatCard 
          title="Pending Requests" 
          value="7" 
          description="2 new requests today" 
          icon={<AlertTriangle className="w-4 h-4" />}
          trend={{ value: 5, positive: false }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Distribution of items across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Movement Trends</CardTitle>
            <CardDescription>Checkouts vs Returns over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="checkouts" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="returns" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Important system notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-md flex items-start ${
                      alert.priority === 'high' 
                        ? 'bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                        : alert.priority === 'medium' 
                        ? 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' 
                        : 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                    <p>{alert.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No current alerts</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in your association</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{activity.user}</p>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
