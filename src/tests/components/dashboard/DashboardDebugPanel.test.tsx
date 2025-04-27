import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardDebugPanel from '@/components/dashboard/DashboardDebugPanel';

vi.mock('@/components/dashboard/DebugModeToggle', () => ({
  __esModule: true,
  default: (props: any) => <button onClick={props.toggleDebugMode}>ToggleDebug</button>,
}));
vi.mock('@/utils/debug-panel', () => ({
  __esModule: true,
  default: () => <div>DebugPanelMock</div>,
}));
vi.mock('@/components/dashboard/DashboardPerformanceDebug', () => ({
  __esModule: true,
  default: (props: any) => props.isVisible ? <div>PerformanceDebugMock</div> : null,
}));

describe('DashboardDebugPanel', () => {
  it('renders debug toggle and general tab', () => {
    render(
      <DashboardDebugPanel
        isDebugMode={true}
        toggleDebugMode={() => {}}
        networkStatus={{ status: 'online' }}
        user={null}
        currentAssociation={null}
        lastError={null}
        handleRetry={() => {}}
        retryCount={0}
      />
    );
    expect(screen.getByText(/ToggleDebug/)).toBeInTheDocument();
    expect(screen.getByText(/DebugPanelMock/)).toBeInTheDocument();
  });

  it('shows performance tab when selected', () => {
    render(
      <DashboardDebugPanel
        isDebugMode={true}
        toggleDebugMode={() => {}}
        networkStatus={{ status: 'online' }}
        user={null}
        currentAssociation={null}
        lastError={null}
        handleRetry={() => {}}
        retryCount={0}
      />
    );
    fireEvent.click(screen.getByText(/Performance/i));
    expect(screen.getByText(/PerformanceDebugMock/)).toBeInTheDocument();
  });
});
