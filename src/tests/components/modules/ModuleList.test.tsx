import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModuleList from '@/components/modules/ModuleList'; // Adjust path if needed
import React from 'react';

// Mock dependencies
vi.mock('@/components/modules/ModuleService', () => ({ // Adjust path
  ModuleService: {
    getInstance: () => ({
      getAvailableModules: vi.fn().mockResolvedValue([]), // Default empty
      getEnabledModules: vi.fn().mockResolvedValue([]),
    }),
  },
}));
vi.mock('@/components/modules/ModuleCard', () => ({ // Adjust path
  default: ({ module }: { module: any }) => <div data-testid="module-card">{module.name}</div>,
}));
vi.mock('@/components/ui/spinner', () => ({ // Adjust path
    Spinner: () => <div role="progressbar">Loading...</div>
}));

const mockModules = [
  { id: 'mod1', name: 'Inventory Module', version: '1.0', description: 'Manages inventory' },
  { id: 'mod2', name: 'Events Module', version: '1.1', description: 'Manages events' },
];

describe('ModuleList', () => {
  it('renders loading state initially', () => {
    vi.mock('@/components/modules/ModuleService', () => ({
      ModuleService: {
        getInstance: () => ({
          getAvailableModules: vi.fn(() => new Promise(() => {})), // Never resolves
          getEnabledModules: vi.fn(() => new Promise(() => {})),
        }),
      },
    }));
    const ModuleListReloaded = require('@/components/modules/ModuleList').default;
    render(<ModuleListReloaded />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders empty state when no modules available', async () => {
     vi.mock('@/components/modules/ModuleService', () => ({
       ModuleService: {
         getInstance: () => ({
           getAvailableModules: vi.fn().mockResolvedValue([]),
           getEnabledModules: vi.fn().mockResolvedValue([]),
         }),
       },
     }));
     const ModuleListReloaded = require('@/components/modules/ModuleList').default;
     render(<ModuleListReloaded />);
     expect(await screen.findByText(/No modules available/i)).toBeInTheDocument();
   });

  it('renders list of available modules', async () => {
    vi.mock('@/components/modules/ModuleService', () => ({
      ModuleService: {
        getInstance: () => ({
          getAvailableModules: vi.fn().mockResolvedValue(mockModules),
          getEnabledModules: vi.fn().mockResolvedValue(['mod1']), // Assume mod1 is enabled
        }),
      },
    }));
    const ModuleListReloaded = require('@/components/modules/ModuleList').default;
    render(<ModuleListReloaded />);
    expect(await screen.findByText('Inventory Module')).toBeInTheDocument();
    expect(await screen.findByText('Events Module')).toBeInTheDocument();
    expect(screen.getAllByTestId('module-card').length).toBe(2);
  });
});
