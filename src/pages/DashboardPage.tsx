
import React, { Suspense } from 'react';
import Dashboard from './Dashboard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="container mx-auto py-6"><DashboardSkeleton /></div>}>
        <Dashboard />
      </Suspense>
    </div>
  );
};

export default DashboardPage;
