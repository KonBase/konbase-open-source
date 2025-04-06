
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { languages } from '@/utils/languageUtils';
import { useTheme } from '@/contexts/ThemeProvider';
import { dateFormats, timeFormats } from '@/utils/dateTimeUtils';
import { Globe, CalendarIcon, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const LanguageRegionSettings = () => {
  const { language, setLanguage, dateFormat, setDateFormat, timeFormat, setTimeFormat } = useTheme();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [isFormSaving, setIsFormSaving] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(true);
  const [isDateFormatOpen, setIsDateFormatOpen] = useState(true);
  const [isTimeFormatOpen, setIsTimeFormatOpen] = useState(true);

  const savePreferences = async () => {
    setIsFormSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Settings updated",
        description: "Your language and region preferences have been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save preferences",
        description: "There was a problem updating your settings.",
      });
    } finally {
      setIsFormSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" /> 
          Language & Region
        </CardTitle>
        <CardDescription>Set your language and regional preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Section */}
        <Collapsible
          open={isLanguageOpen}
          onOpenChange={setIsLanguageOpen}
          className="w-full border rounded-md p-2"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="language" className="font-medium">Display Language</Label>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                {isLanguageOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="pt-2">
            <Select 
              value={language} 
              onValueChange={setLanguage}
            >
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name} {lang.nativeName !== lang.name && `(${lang.nativeName})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Date Format Section */}
        <Collapsible
          open={isDateFormatOpen}
          onOpenChange={setIsDateFormatOpen}
          className="w-full border rounded-md p-2"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="date-format" className="font-medium flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" /> Date Format
            </Label>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                {isDateFormatOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="pt-2">
            <Select 
              value={dateFormat} 
              onValueChange={(value) => setDateFormat(value as any)}
            >
              <SelectTrigger id="date-format" className="w-full">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Time Format Section */}
        <Collapsible
          open={isTimeFormatOpen}
          onOpenChange={setIsTimeFormatOpen}
          className="w-full border rounded-md p-2"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="time-format" className="font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" /> Time Format
            </Label>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                {isTimeFormatOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="pt-2">
            <Select 
              value={timeFormat} 
              onValueChange={(value) => setTimeFormat(value as any)}
            >
              <SelectTrigger id="time-format" className="w-full">
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="flex justify-center pt-4">
          <Button 
            onClick={savePreferences} 
            disabled={isFormSaving} 
            className="w-full sm:w-auto"
          >
            {isFormSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageRegionSettings;
