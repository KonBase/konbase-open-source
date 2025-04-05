
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const NoAssociationView: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to KonBase</CardTitle>
          <CardDescription>You need to set up your association first</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">To get started with KonBase, you need to create or join an association.</p>
          <Button asChild>
            <Link to="/setup">Set Up Association</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoAssociationView;
