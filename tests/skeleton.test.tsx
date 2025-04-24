import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../src/components/ui/skeleton'; // Adjust path as needed

describe('Skeleton Component', () => {
  it('should render the skeleton component', () => {
    render(<Skeleton data-testid="skeleton-element" />);
    const skeletonElement = screen.getByTestId('skeleton-element');
    expect(skeletonElement).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<Skeleton data-testid="skeleton-element" />);
    const skeletonElement = screen.getByTestId('skeleton-element');
    expect(skeletonElement).toHaveClass('animate-pulse');
    expect(skeletonElement).toHaveClass('rounded-md');
    expect(skeletonElement).toHaveClass('bg-muted');
  });

  it('should apply custom className', () => {
    render(<Skeleton data-testid="skeleton-element" className="custom-class h-10 w-20" />);
    const skeletonElement = screen.getByTestId('skeleton-element');
    expect(skeletonElement).toHaveClass('custom-class');
    expect(skeletonElement).toHaveClass('h-10');
    expect(skeletonElement).toHaveClass('w-20');
  });

  it('should pass through other HTML attributes', () => {
    render(<Skeleton data-testid="skeleton-element" aria-label="Loading content" />);
    const skeletonElement = screen.getByTestId('skeleton-element');
    expect(skeletonElement).toHaveAttribute('aria-label', 'Loading content');
  });
});
