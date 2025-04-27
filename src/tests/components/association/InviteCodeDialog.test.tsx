import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InviteCodeDialog from '@/components/association/InviteCodeDialog';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('InviteCodeDialog', () => {
  it('renders and submits code', async () => {
    const onAccept = vi.fn().mockResolvedValue(true);
    const onOpenChange = vi.fn();
    render(
      <InviteCodeDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        onAcceptInvitation={onAccept}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/invitation code/i), { target: { value: 'CODE123' } });
    fireEvent.click(screen.getByText(/Join Association/i));
    expect(onAccept).toHaveBeenCalledWith('CODE123');
  });

  it('calls onOpenChange(false) on cancel', () => {
    const onAccept = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <InviteCodeDialog
        isOpen={true}
        onOpenChange={onOpenChange}
        onAcceptInvitation={onAccept}
      />
    );
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
