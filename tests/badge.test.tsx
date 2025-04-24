import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../src/components/ui/badge'; // Adjust path as needed

describe('Badge Component', () => {
  it('should render the badge with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badgeElement = screen.getByText('Default Badge');
    expect(badgeElement).toBeInTheDocument();
    // Check for default variant classes (adjust based on actual implementation)
    expect(badgeElement).toHaveClass('border-transparent');
    expect(badgeElement).toHaveClass('bg-primary');
    expect(badgeElement).toHaveClass('text-primary-foreground');
  });

  it('should render the badge with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badgeElement = screen.getByText('Secondary Badge');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('bg-secondary');
    expect(badgeElement).toHaveClass('text-secondary-foreground');
  });

  it('should render the badge with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badgeElement = screen.getByText('Destructive Badge');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('bg-destructive');
    expect(badgeElement).toHaveClass('text-destructive-foreground');
  });

  it('should render the badge with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badgeElement = screen.getByText('Outline Badge');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('text-foreground'); // Outline variant usually just sets border and text color
    expect(badgeElement).not.toHaveClass('bg-primary'); // Ensure it doesn't have background colors from other variants
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom Class Badge</Badge>);
    const badgeElement = screen.getByText('Custom Class Badge');
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveClass('custom-class');
  });

  it('should pass through other HTML attributes', () => {
    render(<Badge aria-label="Important">Attribute Badge</Badge>);
    const badgeElement = screen.getByText('Attribute Badge');
    expect(badgeElement).toHaveAttribute('aria-label', 'Important');
  });
});
