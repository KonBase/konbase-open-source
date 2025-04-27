import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TwoFactorSetup from '@/components/auth/TwoFactorSetup';
import React from 'react';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { secret: 'SECRET', keyUri: 'otpauth://totp/label?secret=SECRET' }, error: null }),
    },
  },
}));
vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,QR'),
}));
vi.mock('@/utils/debug', () => ({
  logDebug: vi.fn(),
  isDebugModeEnabled: () => false,
}));

describe('TwoFactorSetup', () => {
  it('renders setup instructions', () => {
    render(
      <TwoFactorSetup
        onVerified={vi.fn()}
        onCancel={vi.fn()}
        errorMessage={null}
        setErrorMessage={vi.fn()}
      />
    );
    expect(screen.getByText(/authenticator app/i)).toBeInTheDocument();
  });
});
