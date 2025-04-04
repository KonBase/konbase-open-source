
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowDownIcon, ArrowUpIcon, FileIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';
import { associationToCSV, downloadCSV, generateCSVTemplate } from '@/utils/csvExport';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

const ImportExport = () => {
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  const [isExporting, setIsExporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportCSV = async () => {
    if (!currentAssociation) {
      toast({
        title: "Error",
        description: "No association selected",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      const csv = await associationToCSV(currentAssociation.id);
      downloadCSV(csv, `${currentAssociation.name.replace(/\s+/g, '_')}_export_${new Date().toISOString().slice(0, 10)}.csv`);
      
      toast({
        title: "Export Successful",
        description: "Association data exported to CSV"
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "An error occurred during export",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportTemplate = () => {
    try {
      const template = generateCSVTemplate();
      downloadCSV(template, 'association_import_template.csv');
      
      toast({
        title: "Template Downloaded",
        description: "CSV import template has been downloaded"
      });
    } catch (error: any) {
      console.error('Template export error:', error);
      toast({
        title: "Template Download Failed",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };
  
  const handleImport = () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import",
        variant: "destructive"
      });
      return;
    }
    
    // Demo import progress simulation
    setIsImporting(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setImportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsImporting(false);
        setImportDialogOpen(false);
        setImportFile(null);
        setImportProgress(0);
        
        toast({
          title: "Import Successful",
          description: "CSV data has been imported successfully"
        });
      }
    }, 500);
  };

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
            <CardDescription>Import items from CSV files.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Upload a CSV file in the supported format to import inventory items.
              Download the template for the correct format.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <ArrowDownIcon className="mr-2 h-4 w-4" />
                Select Import File
              </Button>
              <Button variant="secondary" onClick={handleExportTemplate}>
                <FileIcon className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Export Inventory</CardTitle>
            <CardDescription>Export your inventory to CSV format.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Export your inventory data for backup or reporting purposes.
            </p>
            <Button 
              variant="outline" 
              onClick={handleExportCSV} 
              disabled={isExporting || !currentAssociation}
            >
              <ArrowUpIcon className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export as CSV'}
            </Button>
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
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data from CSV</DialogTitle>
            <DialogDescription>
              Select a CSV file to import. Make sure it follows the correct format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isImporting}
              />
            </div>
            
            {isImporting && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Importing data...</p>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(false)}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!importFile || isImporting}>
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportExport;
