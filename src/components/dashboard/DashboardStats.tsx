
import React from 'react';
import { Package, FileBox, MapPin, Calendar } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface DashboardStatsProps {
  stats: {
    itemsCount: number;
    categoriesCount: number;
    locationsCount: number;
    conventionsCount: number;
  };
  isLoading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <StatCard
              title="Loading..."
              value=""
              icon={<div className="h-4 w-4 bg-muted rounded" />}
              description={<div className="h-4 w-24 bg-muted rounded" />}
            />
          </div>
        ))}
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
