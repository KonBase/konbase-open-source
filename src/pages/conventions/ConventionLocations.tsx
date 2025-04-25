import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ConventionLocationsTab from '@/components/conventions/ConventionLocationsTab';

const ConventionLocations = () => {
  const { id: conventionId } = useParams<{ id: string }>();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Convention Locations</h1>
          <p className="text-muted-foreground">Manage specific rooms, areas, or venues for this convention.</p>
          {/* Link back to convention details */}
          <Button variant="link" asChild className="p-0 h-auto text-sm">
            <RouterLink to={`/conventions/${conventionId}`}>Back to Convention Details</RouterLink>
          </Button>
        </div>
      </div>

      {/* Use the ConventionLocationsTab component */}
      {conventionId && <ConventionLocationsTab conventionId={conventionId} />}
    </div>
  );
};

export default ConventionLocations;
