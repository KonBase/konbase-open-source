
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface AuditLog {
  id: string;
  action: string;
  created_at: string;
  entity: string;
  entity_id: string;
}

interface RecentActivityCardProps {
  isLoading: boolean;
  activities: AuditLog[] | null;
  error: any;
  onRetry: () => void;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ 
  isLoading, 
  activities, 
  error, 
  onRetry 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center">
              <Spinner size="sm" />
            </div>
          ) : activities && Array.isArray(activities) && activities.length > 0 ? (
            <ul className="space-y-2">
              {activities.map((activity) => (
                <li key={activity.id} className="text-sm">
                  <span className="font-medium">{activity.action}</span>: {activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Unknown time'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activities to display</p>
          )}
          
          {error && (
            <button 
              onClick={onRetry}
              className="text-xs text-primary underline"
            >
              Error loading activities. Click to retry.
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
