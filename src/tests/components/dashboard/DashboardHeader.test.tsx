import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { role: 'super_admin' },
  }),
}));

describe('DashboardHeader', () => {
  it('renders with association', () => {
    render(
      <DashboardHeader
        currentAssociation={{ id: 'a1', name: 'Test Association' } as any}
        user={{ name: 'Alice' } as any}
        isHome={true}
      />
    );
    expect(screen.getByText(/Test Association/)).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Alice!/)).toBeInTheDocument();
    expect(screen.getByText(/System administration mode enabled/)).toBeInTheDocument();
  });

  it('renders without association', () => {
    render(
      <DashboardHeader
        currentAssociation={null}
        user={{ name: 'Bob' } as any}
        isHome={true}
      />
    );
    expect(screen.getByText(/No association selected/)).toBeInTheDocument();
  });
});
