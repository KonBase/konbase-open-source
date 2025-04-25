import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowDownIcon, ArrowUpIcon, FileIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';
import { associationToCSV, exportToCSV, generateCSVTemplate, parseCSVForImport, importCSVData } from '@/utils/csvExport';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Association } from '@/types/association';

interface ImportStats {
  categoriesAdded: number;
  locationsAdded: number;
  itemsAdded: number;
}

interface ImportOperation {
  id: string;
  timestamp: Date;
  filename: string;
  status: 'completed' | 'failed' | 'in_progress';
  stats: ImportStats;
  errors: string[];
}

interface ExportOperation {
  id: string;
  timestamp: Date;
  filename: string;
  status: 'completed' | 'failed' | 'in_progress';
}

// Helper function to download text content as a file
const downloadTextFile = (content: string, filename: string, contentType: string = 'text/plain') => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ImportExport: React.FC = () => {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
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
      setImportHistory([]);
      setExportHistory([]);
    } catch (error) {
      console.error('Error fetching import/export history:', error);
    }
  };

  const handleExport = async () => {
    if (!currentAssociation ) {
      toast({
        title: 'Error',
        description: 'Association data not fully loaded.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsExporting(true);
    try {
      const dataToExport = currentAssociation.items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        serial_number: item.serial_number,
        barcode: item.barcode,
        condition: item.condition,
        category_id: item.category_id,
        location_id: item.location_id,
        purchase_date: item.purchase_date,
        purchase_price: item.purchase_price,
        warranty_expiration: item.warranty_expiration,
        is_consumable: item.is_consumable,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        notes: item.notes,
      }));

      exportToCSV(dataToExport, `${currentAssociation.name}_inventory_export`);
      
      toast({
        title: 'Export Successful',
        description: 'Your inventory data has been exported to CSV.',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportTemplate = () => {
    try {
      const template = generateCSVTemplate();
      downloadTextFile(template, 'association_import_template.csv', 'text/csv');
      
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
    if (!importFile || !currentAssociation) return false;
    
    setIsImporting(true);
    setImportProgress(10);
    
    try {
      const fileContent = await readFileAsText(importFile);
      setImportProgress(30);
      
      const { categories, locations, items, errors } = await parseCSVForImport(fileContent, currentAssociation.id);
      setImportProgress(70);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setValidationDialogOpen(true);
        setImportProgress(100);
        setTimeout(() => setImportProgress(0), 500);
        setIsImporting(false);
        return false;
      }
      
      setParsedData({ categories, locations, items });
      setImportProgress(100);
      
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
    
    const isValid = await validateImportFile();
    if (!isValid) return;
    
    try {
      setImportProgress(70);
      
      const { success, errors, stats } = await importCSVData(parsedData, currentAssociation.id);
      
      const importStats: ImportStats = {
        categoriesAdded: stats.categoriesAdded || 0,
        locationsAdded: stats.locationsAdded || 0,
        itemsAdded: stats.itemsAdded || 0
      };
      
      const newImport: ImportOperation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        filename: importFile.name,
        status: success ? 'completed' : 'failed',
        stats: importStats,
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
          description: `Imported ${importStats.categoriesAdded} categories, ${importStats.locationsAdded} locations, and ${importStats.itemsAdded} items.`
        });
        
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
      
      const newImport: ImportOperation = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        filename: importFile.name,
        status: 'failed',
        stats: {
          categoriesAdded: 0,
          locationsAdded: 0,
          itemsAdded: 0
        },
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Import & Export</h1>
          <p className="text-muted-foreground">Import and export your inventory data.</p>
        </div>
      </div>
      
      <div className="grid gap-4 lg:grid-cols-2">
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
            <div className="flex flex-wrap gap-2">
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
              onClick={handleExport} 
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
                      <div key={operation.id} className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
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
                            className="mt-2 sm:mt-0"
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
                      <div key={operation.id} className="p-3 sm:p-4">
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
          
          <div className="space-y-4 py-4">
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
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
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
          
          <ScrollArea className="h-[60vh] max-h-[400px] rounded border p-4 my-4">
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
