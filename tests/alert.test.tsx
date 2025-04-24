import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react'; // Example icon

describe('Alert Component', () => {
  it('renders the Alert component', () => {
    render(<Alert data-testid="alert-component">Alert Content</Alert>);
    const alertElement = screen.getByTestId('alert-component');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveTextContent('Alert Content');
  });

  it('renders Alert with title and description', () => {
    render(
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Heads up!</AlertTitle>
        <AlertDescription>
          You can add components to your app using the cli.
        </AlertDescription>
      </Alert>
    );
    expect(screen.getByText('Heads up!')).toBeInTheDocument();
    expect(screen.getByText('You can add components to your app using the cli.')).toBeInTheDocument();
  });

  it('renders AlertTitle correctly', () => {
    render(<AlertTitle data-testid="alert-title">Test Title</AlertTitle>);
    const titleElement = screen.getByTestId('alert-title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('Test Title');
    // Check for default classes if necessary
    expect(titleElement).toHaveClass('font-medium');
  });

  it('renders AlertDescription correctly', () => {
    render(<AlertDescription data-testid="alert-description">Test Description</AlertDescription>);
    const descriptionElement = screen.getByTestId('alert-description');
    expect(descriptionElement).toBeInTheDocument();
    expect(descriptionElement).toHaveTextContent('Test Description');
    // Check for default classes if necessary
    expect(descriptionElement).toHaveClass('text-sm');
  });

  it('applies variant classes correctly', () => {
    render(<Alert variant="destructive" data-testid="alert-destructive">Destructive Alert</Alert>);
    const alertElement = screen.getByTestId('alert-destructive');
    expect(alertElement).toHaveClass('border-destructive/50'); // Example class check based on variant definition
    expect(alertElement).toHaveClass('text-destructive');
  });

  it('passes additional props', () => {
    render(<Alert id="custom-id" className="extra-class">Alert Content</Alert>);
    const alertElement = screen.getByText('Alert Content');
    expect(alertElement).toHaveAttribute('id', 'custom-id');
    expect(alertElement).toHaveClass('extra-class');
  });
});