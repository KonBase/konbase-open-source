
import React from 'react';
import { Package, FileBox, MapPin, Calendar } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner, LoadingError } from '@/components/ui/spinner';

interface DashboardStatsProps {
  stats: {
    itemsCount: number;
    categoriesCount: number;
    locationsCount: number;
    conventionsCount: number;
  };
  isLoading: boolean;
  error?: any;
  onRetry?: () => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  isLoading, 
  error, 
  onRetry 
}) => {
  if (error) {
    return <LoadingError error={error} retry={onRetry} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" loadingText="Loading dashboard statistics..." />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Items"
        value={stats.itemsCount}
        icon={<Package className="h-4 w-4" />}
        description="Items in inventory"
      />
      <StatCard
        title="Categories"
        value={stats.categoriesCount}
        icon={<FileBox className="h-4 w-4" />}
        description="Item categories"
      />
      <StatCard
        title="Locations"
        value={stats.locationsCount}
        icon={<MapPin className="h-4 w-4" />}
        description="Storage locations"
      />
      <StatCard
        title="Conventions"
        value={stats.conventionsCount}
        icon={<Calendar className="h-4 w-4" />}
        description="Total conventions"
      />
    </div>
  );
};

export default DashboardStats;
