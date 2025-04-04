
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

const ImportExport = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import & Export</h1>
          <p className="text-muted-foreground">Import and export your inventory data.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Import Inventory</CardTitle>
            <CardDescription>Import items from CSV, Excel, or JSON files.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Upload a file in the supported formats to import inventory items.
              Templates are available for download.
            </p>
            <Button variant="outline">
              <ArrowDownIcon className="mr-2 h-4 w-4" />
              Select Import File
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Export Inventory</CardTitle>
            <CardDescription>Export your inventory to various formats.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Export your inventory data for backup or reporting purposes.
            </p>
            <div className="flex gap-2">
              <Button variant="outline">
                <ArrowUpIcon className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
              <Button variant="outline">
                <ArrowUpIcon className="mr-2 h-4 w-4" />
                Export as Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Import/Export History</CardTitle>
          <CardDescription>History of all import and export operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              No import/export operations performed yet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportExport;
