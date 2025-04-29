import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModuleSettingsDialog from '@/components/modules/ModuleSettingsDialog'; // Adjust path if needed
import React from 'react';

// Mock dependencies
vi.mock('@/components/modules/ModuleService', () => ({ // Adjust path
  ModuleService: {
    getInstance: () => ({
      getModuleSettings: vi.fn().mockResolvedValue({ setting1: 'value1' }),
      saveModuleSettings: vi.fn().mockResolvedValue(true),
      getModuleManifest: vi.fn().mockResolvedValue(mockModuleManifest), // Need manifest for settings definition
    }),
  },
}));
vi.mock('@/components/ui/use-toast', () => ({ // Adjust path
  useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/components/ui/dialog', () => ({ // Adjust path
  Dialog: ({ children, open }: { children: React.ReactNode, open: boolean }) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/button', () => ({ // Adjust path
    Button: (props: any) => <button {...props}>{props.children}</button>
}));
vi.mock('@/components/ui/input', () => ({ // Adjust path
    Input: (props: any) => <input {...props} />
}));
vi.mock('@/components/ui/label', () => ({ // Adjust path
    Label: (props: any) => <label {...props}>{props.children}</label>
}));

const mockModuleManifest = {
  id: 'mod1',
  name: 'Inventory Module',
  settingsSchema: [ // Example schema
    { id: 'setting1', label: 'Setting One', type: 'text', defaultValue: 'default' },
    { id: 'setting2', label: 'Setting Two', type: 'number', defaultValue: 10 },
  ],
};

describe('ModuleSettingsDialog', () => {
  it('renders dialog with title and description when open', async () => {
    render(<ModuleSettingsDialog moduleId="mod1" isOpen={true} onClose={vi.fn()} />);
    expect(await screen.findByText(/Inventory Module Settings/i)).toBeInTheDocument();
    // Check for a setting label based on schema
    expect(screen.getByLabelText(/Setting One/i)).toBeInTheDocument();
  });

  it('does not render dialog when closed', () => {
    render(<ModuleSettingsDialog moduleId="mod1" isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/Inventory Module Settings/i)).not.toBeInTheDocument();
  });

  it('loads existing settings into form fields', async () => {
    render(<ModuleSettingsDialog moduleId="mod1" isOpen={true} onClose={vi.fn()} />);
    // Wait for settings to load and form to populate
    const input = await screen.findByLabelText(/Setting One/i) as HTMLInputElement;
    expect(input.value).toBe('value1'); // From getModuleSettings mock
  });

  it('calls saveModuleSettings and onClose on save', async () => {
    const onCloseMock = vi.fn();
    const saveSettingsMock = vi.fn().mockResolvedValue(true);
    vi.mock('@/components/modules/ModuleService', () => ({
      ModuleService: {
        getInstance: () => ({
          getModuleSettings: vi.fn().mockResolvedValue({ setting1: 'value1' }),
          saveModuleSettings: saveSettingsMock,
          getModuleManifest: vi.fn().mockResolvedValue(mockModuleManifest),
        }),
      },
    }));
    const ModuleSettingsDialogReloaded = require('@/components/modules/ModuleSettingsDialog').default;

    render(<ModuleSettingsDialogReloaded moduleId="mod1" isOpen={true} onClose={onCloseMock} />);
    await screen.findByLabelText(/Setting One/i); // Ensure loaded

    // Change a setting
    fireEvent.change(screen.getByLabelText(/Setting One/i), { target: { value: 'new value' } });

    // Click save
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(saveSettingsMock).toHaveBeenCalledWith('mod1', expect.objectContaining({ setting1: 'new value' }));
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
     const onCloseMock = vi.fn();
     render(<ModuleSettingsDialog moduleId="mod1" isOpen={true} onClose={onCloseMock} />);
     await screen.findByText(/Inventory Module Settings/i); // Ensure loaded
     fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
     expect(onCloseMock).toHaveBeenCalled();
   });
});
