import React from 'react';
import { Header } from '@/components/layout/Header';
import Dashboard from './Dashboard';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-6">
        <Dashboard />
      </div>
    </div>
  );
};

export default DashboardPage;
