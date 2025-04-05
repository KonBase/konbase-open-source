
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowDownIcon, ArrowUpIcon, FileIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';
import { associationToCSV, downloadCSV, generateCSVTemplate, parseCSVForImport, importCSVData } from '@/utils/csvExport';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImportOperation {
  id: string;
  timestamp: Date;
  filename: string;
  status: 'completed' | 'failed' | 'in_progress';
  stats: {
    categoriesAdded: number;
    locationsAdded: number;
    itemsAdded: number;
  };
  errors: string[];
}

interface ExportOperation {
  id: string;
  timestamp: Date;
  filename: string;
  status: 'completed' | 'failed' | 'in_progress';
}

const ImportExport = () => {
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  const [isExporting, setIsExporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportOperation[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportOperation[]>([]);
  const [historyTab, setHistoryTab] = useState('imports');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  useEffect(() => {
    if (currentAssociation) {
      fetchImportExportHistory();
    }
  }, [currentAssociation]);

  const fetchImportExportHistory = async () => {
    if (!currentAssociation) return;
    
    try {
      // For a real implementation, you would store these operations in Supabase
      // This is a placeholder for now
      setImportHistory([]);
      setExportHistory([]);
    } catch (error) {
      console.error('Error fetching import/export history:', error);
    }
  };

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
      const filename = `${currentAssociation.name.replace(/\s+/g, '_')}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCSV(csv, filename);
      
      // Record the export operation
      const newExport: ExportOperation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        filename,
        status: 'completed'
      };
      
      setExportHistory(prev => [newExport, ...prev]);
      
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
      
      // Record the failed export
      const newExport: ExportOperation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        filename: `${currentAssociation.name.replace(/\s+/g, '_')}_export_failed.csv`,
        status: 'failed'
      };
      
      setExportHistory(prev => [newExport, ...prev]);
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
      setValidationErrors([]);
      setParsedData(null);
    }
  };
  
  const validateImportFile = async () => {
    if (!importFile || !currentAssociation) return;
    
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      // Read the file
      const fileContent = await readFileAsText(importFile);
      setImportProgress(30);
      
      // Parse and validate the CSV
      const { categories, locations, items, errors } = await parseCSVForImport(fileContent, currentAssociation.id);
      setImportProgress(70);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setValidationDialogOpen(true);
        setImportProgress(100);
        setTimeout(() => setImportProgress(0), 500);
        setIsImporting(false);
        return;
      }
      
      // If validation passes, store the parsed data for import
      setParsedData({ categories, locations, items });
      setImportProgress(100);
      
      // Proceed with import if there are no errors
      return true;
    } catch (error: any) {
      console.error('Validation error:', error);
      setValidationErrors([`Error validating file: ${error.message}`]);
      setValidationDialogOpen(true);
      setImportProgress(0);
      setIsImporting(false);
      return false;
    }
  };
  
  const handleImport = async () => {
    if (!importFile || !currentAssociation) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import",
        variant: "destructive"
      });
      return;
    }
    
    // First validate the file
    const isValid = await validateImportFile();
    if (!isValid) return;
    
    try {
      setImportProgress(70);
      
      // Import the data
      const { success, errors, stats } = await importCSVData(parsedData, currentAssociation.id);
      
      // Record the import operation
      const newImport: ImportOperation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        filename: importFile.name,
        status: success ? 'completed' : 'failed',
        stats,
        errors
      };
      
      setImportHistory(prev => [newImport, ...prev]);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setValidationDialogOpen(true);
      }
      
      setImportProgress(100);
      
      if (success) {
        toast({
          title: "Import Successful",
          description: `Imported ${stats.categoriesAdded} categories, ${stats.locationsAdded} locations, and ${stats.itemsAdded} items.`
        });
        
        // Close the dialog after successful import
        setTimeout(() => {
          setImportDialogOpen(false);
          setImportFile(null);
          setImportProgress(0);
          setParsedData(null);
        }, 1000);
      } else {
        toast({
          title: "Import Completed with Errors",
          description: `Please check the error details.`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setValidationErrors([`Error during import: ${error.message}`]);
      setValidationDialogOpen(true);
      
      // Record the failed import
      const newImport: ImportOperation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        filename: importFile.name,
        status: 'failed',
        stats: { categoriesAdded: 0, locationsAdded: 0, itemsAdded: 0 },
        errors: [`Error during import: ${error.message}`]
      };
      
      setImportHistory(prev => [newImport, ...prev]);
    } finally {
      setIsImporting(false);
    }
  };
  
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
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
          {(importHistory.length === 0 && exportHistory.length === 0) ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                No import/export operations performed yet.
              </p>
            </div>
          ) : (
            <Tabs value={historyTab} onValueChange={setHistoryTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="imports">Imports</TabsTrigger>
                <TabsTrigger value="exports">Exports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="imports" className="border rounded-md mt-4">
                {importHistory.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No import operations yet.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {importHistory.map(operation => (
                      <div key={operation.id} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium flex items-center">
                            {operation.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                            {operation.status === 'failed' && <XCircle className="w-4 h-4 text-red-500 mr-2" />}
                            {operation.status === 'in_progress' && <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />}
                            {operation.filename}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {operation.timestamp.toLocaleString()}
                          </div>
                          {operation.status === 'completed' && (
                            <div className="text-sm mt-1">
                              Added: {operation.stats.categoriesAdded} categories, 
                              {operation.stats.locationsAdded} locations, 
                              {operation.stats.itemsAdded} items
                            </div>
                          )}
                        </div>
                        {operation.errors.length > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setValidationErrors(operation.errors);
                              setValidationDialogOpen(true);
                            }}
                          >
                            View Errors
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="exports" className="border rounded-md mt-4">
                {exportHistory.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No export operations yet.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {exportHistory.map(operation => (
                      <div key={operation.id} className="p-4">
                        <div className="font-medium flex items-center">
                          {operation.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                          {operation.status === 'failed' && <XCircle className="w-4 h-4 text-red-500 mr-2" />}
                          {operation.status === 'in_progress' && <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />}
                          {operation.filename}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {operation.timestamp.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
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
                <p className="text-sm text-muted-foreground">
                  {importProgress < 70 ? 'Validating data...' : 'Importing data...'}
                </p>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}
            
            <DialogFooter className="flex justify-end space-x-2">
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
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Validation Results</DialogTitle>
            <DialogDescription>
              The following issues were found in your CSV file:
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[300px] rounded border p-4">
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button 
              onClick={() => setValidationDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportExport;
