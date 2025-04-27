import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';

vi.mock('@/components/dashboard/NoAssociationView', () => ({
  __esModule: true,
  default: () => <div>NoAssociationViewMock</div>,
}));
vi.mock('@/components/dashboard/DashboardDebugPanel', () => ({
  __esModule: true,
  default: () => <div>DashboardDebugPanelMock</div>,
}));

describe('DashboardEmptyState', () => {
  it('renders no association view and debug panel', () => {
    render(
      <DashboardEmptyState
        networkStatus={{}}
        isDebugMode={false}
        toggleDebugMode={() => {}}
        user={null}
        currentAssociation={null}
        handleRetry={() => {}}
        lastError={null}
        retryCount={0}
      />
    );
    expect(screen.getByText(/NoAssociationViewMock/)).toBeInTheDocument();
    expect(screen.getByText(/DashboardDebugPanelMock/)).toBeInTheDocument();
  });
});
