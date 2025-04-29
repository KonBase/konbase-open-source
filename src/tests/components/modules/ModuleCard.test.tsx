import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModuleCard from '@/components/modules/ModuleCard'; // Adjust path if needed
import React from 'react';

// Mock dependencies
vi.mock('@/components/modules/ModuleService', () => ({ // Adjust path
  ModuleService: {
    getInstance: () => ({
      enableModule: vi.fn().mockResolvedValue(true),
      disableModule: vi.fn().mockResolvedValue(true),
    }),
  },
}));
vi.mock('@/components/ui/use-toast', () => ({ // Adjust path
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/components/ui/button', () => ({ // Adjust path
    Button: (props: any) => <button {...props}>{props.children}</button>
}));
vi.mock('@/components/ui/switch', () => ({ // Adjust path
    Switch: (props: any) => <input type="checkbox" role="switch" checked={props.checked} onChange={props.onCheckedChange} />
}));
vi.mock('@/components/ui/card', () => ({ // Adjust path
    Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
    CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CardFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));


const mockModule = {
  id: 'mod1',
  name: 'Inventory Module',
  version: '1.0',
  description: 'Manages inventory items and stock levels.',
  author: 'KonBase Team',
  icon: 'Package', // Assuming icon name is used
};

describe('ModuleCard', () => {
  it('renders module details', () => {
    render(<ModuleCard module={mockModule} isEnabled={false} onToggle={vi.fn()} onOpenSettings={vi.fn()} />);
    expect(screen.getByText('Inventory Module')).toBeInTheDocument();
    expect(screen.getByText('v1.0 by KonBase Team')).toBeInTheDocument();
    expect(screen.getByText('Manages inventory items and stock levels.')).toBeInTheDocument();
  });

  it('shows switch as unchecked when disabled', () => {
    render(<ModuleCard module={mockModule} isEnabled={false} onToggle={vi.fn()} onOpenSettings={vi.fn()} />);
    const switchControl = screen.getByRole('switch');
    expect(switchControl).not.toBeChecked();
  });

  it('shows switch as checked when enabled', () => {
    render(<ModuleCard module={mockModule} isEnabled={true} onToggle={vi.fn()} onOpenSettings={vi.fn()} />);
    const switchControl = screen.getByRole('switch');
    expect(switchControl).toBeChecked();
  });

  it('calls onToggle when switch is clicked', () => {
    const onToggleMock = vi.fn();
    render(<ModuleCard module={mockModule} isEnabled={false} onToggle={onToggleMock} onOpenSettings={vi.fn()} />);
    const switchControl = screen.getByRole('switch');
    fireEvent.click(switchControl);
    expect(onToggleMock).toHaveBeenCalledWith(mockModule.id, true); // Expecting toggle to true
  });

  it('calls onOpenSettings when settings button is clicked (if enabled)', () => {
    const onOpenSettingsMock = vi.fn();
    render(<ModuleCard module={mockModule} isEnabled={true} onToggle={vi.fn()} onOpenSettings={onOpenSettingsMock} />);
    // Assuming a settings button exists when enabled
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    expect(onOpenSettingsMock).toHaveBeenCalledWith(mockModule.id);
  });

   it('disables settings button when disabled', () => {
     render(<ModuleCard module={mockModule} isEnabled={false} onToggle={vi.fn()} onOpenSettings={vi.fn()} />);
     const settingsButton = screen.getByRole('button', { name: /settings/i });
     expect(settingsButton).toBeDisabled();
   });
});
