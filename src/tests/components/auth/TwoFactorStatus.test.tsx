import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TwoFactorStatus from '@/components/auth/TwoFactorStatus';
import React from 'react';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}));
vi.mock('@/utils/debug', () => ({
  logDebug: vi.fn(),
  isDebugModeEnabled: () => false,
}));

describe('TwoFactorStatus', () => {
  it('shows enabled state and disable button', () => {
    render(
      <TwoFactorStatus
        isEnabled={true}
        onSetupStart={vi.fn()}
        errorMessage={null}
        setErrorMessage={vi.fn()}
      />
    );
    expect(screen.getByText(/2FA is enabled/i)).toBeInTheDocument();
    expect(screen.getByText(/Disable 2FA/i)).toBeInTheDocument();
  });

  it('shows disabled state and setup button', () => {
    render(
      <TwoFactorStatus
        isEnabled={false}
        onSetupStart={vi.fn()}
        errorMessage={null}
        setErrorMessage={vi.fn()}
      />
    );
    expect(screen.getByText(/Enhance your account security/i)).toBeInTheDocument();
    expect(screen.getByText(/Set Up 2FA/i)).toBeInTheDocument();
  });

  it('calls onSetupStart when setup button clicked', () => {
    const onSetupStart = vi.fn();
    render(
      <TwoFactorStatus
        isEnabled={false}
        onSetupStart={onSetupStart}
        errorMessage={null}
        setErrorMessage={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText(/Set Up 2FA/i));
    expect(onSetupStart).toHaveBeenCalled();
  });
});
