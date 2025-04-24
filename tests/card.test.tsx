import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card Component', () => {
  it('should render all card parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content Area</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer Area</p>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    // Check if the element has the correct tag name if needed
    expect(screen.getByText('Card Title').tagName).toMatch(/h\d/i); // Matches H1, H2, H3 etc.

    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Description').tagName).toBe('P');

    expect(screen.getByText('Card Content Area')).toBeInTheDocument();
    // Check parent structure if necessary

    expect(screen.getByText('Card Footer Area')).toBeInTheDocument();
     // Check parent structure if necessary
  });

  it('should render card with only content', () => {
     render(
      <Card>
        <CardContent>
          <p>Only Content</p>
        </CardContent>
      </Card>
    );
    expect(screen.getByText('Only Content')).toBeInTheDocument();
    expect(screen.queryByText('Card Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Card Footer Area')).not.toBeInTheDocument();
  });

  // Add tests for custom classNames if needed
});