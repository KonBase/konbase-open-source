import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardError from '@/components/dashboard/DashboardError';

vi.mock('@/components/ui/spinner', () => ({
  LoadingError: () => <div>LoadingErrorMock</div>,
}));
vi.mock('@/components/dashboard/DebugModeToggle', () => ({
  __esModule: true,
  default: (props: any) => <button onClick={props.toggleDebugMode}>ToggleDebug</button>,
}));
vi.mock('@/utils/debug-panel', () => ({
  __esModule: true,
  default: () => <div>DebugPanelMock</div>,
}));

describe('DashboardError', () => {
  it('renders error alert and debug toggle', () => {
    render(
      <DashboardError
        error="Test error"
        handleRetry={() => {}}
        isDebugMode={false}
        toggleDebugMode={() => {}}
        networkStatus={{}}
        user={null}
        currentAssociation={null}
        lastError={null}
        retryCount={0}
      />
    );
    expect(screen.getByText(/Error loading dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/ToggleDebug/i)).toBeInTheDocument();
  });

  it('shows debug panel when debug mode is enabled', () => {
    render(
      <DashboardError
        error="Test error"
        handleRetry={() => {}}
        isDebugMode={true}
        toggleDebugMode={() => {}}
        networkStatus={{}}
        user={null}
        currentAssociation={null}
        lastError={null}
        retryCount={0}
      />
    );
    expect(screen.getByText(/DebugPanelMock/)).toBeInTheDocument();
  });
});
