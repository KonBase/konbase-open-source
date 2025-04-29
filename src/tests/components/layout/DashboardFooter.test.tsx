import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardFooter from '@/components/layout/DashboardFooter'; // Adjust path
import React from 'react';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  Link: (props: any) => <a href={props.to}>{props.children}</a>,
}));
vi.mock('@/hooks/useMobileDetect', () => ({
  useMobileDetect: () => ({ isMobile: false }), // Default: not mobile
}));

describe('DashboardFooter', () => {
  it('renders copyright and links on desktop', () => {
    render(<DashboardFooter />);
    const currentYear = new Date().getFullYear();

    expect(screen.getByText(`© ${currentYear} KonBase`)).toBeInTheDocument();
    expect(screen.getByText('Open Source Supply Chain Management')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    // Check for the separator dot on desktop
    expect(screen.getByText('·')).toBeInTheDocument();
  });

  it('renders without separator dot on mobile', () => {
    vi.doMock('@/hooks/useMobileDetect', () => ({
      useMobileDetect: () => ({ isMobile: true }),
    }));
    const DashboardFooterReloaded = require('@/components/layout/DashboardFooter').default;
    render(<DashboardFooterReloaded />);
    expect(screen.queryByText('·')).not.toBeInTheDocument();
    // Check if text size class is applied (might be fragile)
    const linkContainer = screen.getByText('Terms').closest('div');
    expect(linkContainer).toHaveClass('text-xs');
  });

  it('links point to correct URLs', () => {
    render(<DashboardFooter />);
    expect(screen.getByText('Terms').closest('a')).toHaveAttribute('href', '/terms');
    expect(screen.getByText('Privacy').closest('a')).toHaveAttribute('href', '/privacy');
    expect(screen.getByText('GitHub').closest('a')).toHaveAttribute('href', 'https://github.com/KonBase/KonBase');
  });
});
