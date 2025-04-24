import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label'; // Often used with Checkbox

describe('Checkbox Component', () => {
  it('should render an unchecked checkbox', () => {
    render(<Checkbox id="terms" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should render a checked checkbox when defaultChecked is true', () => {
    render(<Checkbox id="terms" defaultChecked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

   it('should render a checked checkbox when checked prop is true', () => {
    render(<Checkbox id="terms" checked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should toggle checked state on click', () => {
    render(<Checkbox id="terms" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('should call onCheckedChange handler when state changes', () => {
    const handleCheckedChange = vi.fn();
    render(<Checkbox id="terms" onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true); // Radix Checkbox passes boolean state

    fireEvent.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledTimes(2);
    expect(handleCheckedChange).toHaveBeenCalledWith(false);
  });

  it('should be associated with label', () => {
    render(
      <div className="flex items-center space-x-2">
        <Checkbox id="terms-label" />
        <Label htmlFor="terms-label">Accept terms</Label>
      </div>
    );
    const checkbox = screen.getByRole('checkbox');
    const label = screen.getByText('Accept terms');

    // Clicking label should toggle checkbox
    expect(checkbox).not.toBeChecked();
    fireEvent.click(label);
    expect(checkbox).toBeChecked();
  });

  it('should be disabled when disabled prop is true', () => {
     const handleCheckedChange = vi.fn();
     render(<Checkbox id="terms" disabled onCheckedChange={handleCheckedChange} />);
     const checkbox = screen.getByRole('checkbox');
     expect(checkbox).toBeDisabled();
     fireEvent.click(checkbox);
     expect(handleCheckedChange).not.toHaveBeenCalled();
  });

  // Add tests for indeterminate state if applicable
});