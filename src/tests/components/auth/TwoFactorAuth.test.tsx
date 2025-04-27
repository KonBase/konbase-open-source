import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TwoFactorAuth from '@/components/auth/TwoFactorAuth';


vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { two_factor_enabled: false },
    refreshProfile: vi.fn(),
  }),
}));
vi.mock('@/components/auth/TwoFactorStatus', () => ({
  __esModule: true,
  default: () => <div>TwoFactorStatusMock</div>,
}));
vi.mock('@/components/auth/TwoFactorSetup', () => ({
  __esModule: true,
  default: () => <div>TwoFactorSetupMock</div>,
}));
vi.mock('@/components/auth/RecoveryKeyManager', () => ({
  __esModule: true,
  default: () => <div>RecoveryKeyManagerMock</div>,
}));

describe('TwoFactorAuth', () => {
  it('renders status by default', () => {
    render(<TwoFactorAuth />);
    expect(screen.getByText(/TwoFactorStatusMock/)).toBeInTheDocument();
  });
});
