
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({ errorInfo });
    
    // Log the error
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
              <p className="text-muted-foreground mb-4">
                An error occurred in the application. Please try refreshing the page.
              </p>
              {this.state.error && (
                <div className="bg-muted p-3 rounded mb-4 overflow-auto max-h-40">
                  <p className="text-sm font-mono">{this.state.error.toString()}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
                <Button variant="outline" onClick={this.resetError}>
                  Try Again
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">Go to Home</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/login">Go to Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
