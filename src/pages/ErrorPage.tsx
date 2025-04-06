
import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bug, Home, RefreshCw, ArrowLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { logDebug } from '@/utils/debug';

const ErrorPage: React.FC = () => {
  const error = useRouteError();
  
  // Log error for debugging
  React.useEffect(() => {
    logDebug('Route error encountered', error, 'error');
  }, [error]);

  let errorMessage = 'An unknown error occurred';
  let errorStack = '';
  let errorCode = null;

  if (isRouteErrorResponse(error)) {
    // Error from React Router
    errorMessage = error.statusText || error.data?.message || 'Unknown route error';
    errorCode = error.status;
  } else if (error instanceof Error) {
    // Standard JavaScript error
    errorMessage = error.message;
    errorStack = error.stack || '';
  } else if (typeof error === 'string') {
    // String error
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    // Vite or other object-based error
    if ('message' in error) {
      errorMessage = String(error.message);
    }
    if ('stack' in error) {
      errorStack = String(error.stack);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="max-w-lg mx-auto shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600 mb-4">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-xl font-bold">
              {errorCode ? `Error ${errorCode}` : 'Application Error'}
            </h2>
          </div>
          
          <p className="text-muted-foreground mb-4">
            {errorMessage || 'An unexpected error occurred in the application.'}
          </p>
          
          <Accordion type="single" collapsible className="mb-4">
            <AccordionItem value="error-details">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  <span>View Error Details</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs">
                <div className="bg-muted p-3 rounded mb-2 overflow-auto max-h-40">
                  <p className="font-mono break-words">{errorMessage}</p>
                </div>
                
                {errorStack && (
                  <div className="mt-2">
                    <p className="font-semibold mb-1">Error Stack:</p>
                    <div className="bg-muted p-3 rounded overflow-auto max-h-60">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {errorStack}
                      </pre>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="default"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
            
            <Button 
              variant="outline" 
              asChild
              className="flex items-center gap-1"
            >
              <Link to="/">
                <Home className="h-4 w-4" />
                Go to Home
              </Link>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorPage;
