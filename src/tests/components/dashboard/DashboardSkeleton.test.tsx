import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('renders skeleton cards', () => {
    render(<DashboardSkeleton />);
    expect(screen.getAllByText(/Error loading content/i).length).toBe(0);
  });

  it('renders error state', () => {
    render(<DashboardSkeleton showErrorState />);
    expect(screen.getAllByText(/Error loading content/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Network connectivity issues/i)).toBeInTheDocument();
  });
});
