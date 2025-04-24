import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

describe('Button Component', () => {
  it('should render a default button', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    // Check for default variant class if necessary, e.g., using classList.contains
  });

  it('should render different variants', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    // Add checks for other variants (outline, secondary, ghost, link)
  });

  it('should render an icon button', () => {
    render(
      <Button variant="outline" size="icon">
        <Mail className="h-4 w-4" />
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument(); // Check if SVG icon is rendered
  });

   it('should render a button with icon and text', () => {
    render(
      <Button>
        <Mail className="mr-2 h-4 w-4" /> Login with Email
      </Button>
    );
    const button = screen.getByRole('button', { name: /login with email/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText(/login with email/i)).toBeInTheDocument();
  });

  it('should render as child when asChild prop is true', () => {
    render(
      <Button asChild>
        <a href="/login">Login</a>
      </Button>
    );
    // It renders an anchor tag, not a button role
    const link = screen.getByRole('link', { name: /login/i });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    const button = screen.getByRole('button', { name: /clickable/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  // Add tests for loading state if applicable
});