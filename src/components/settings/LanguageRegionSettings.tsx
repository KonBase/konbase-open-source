import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { languages } from '@/utils/languageUtils';
import { useTheme } from '@/contexts/ThemeProvider';
import { dateFormats } from '@/utils/dateTimeUtils';
import { Globe, CalendarIcon, Clock } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import useTranslation from '@/hooks/useTranslation';

const LanguageRegionSettings = () => {
  const { t } = useTranslation();
  const { language, setLanguage, dateFormat, setDateFormat, timeFormat, setTimeFormat } = useTheme();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [isFormSaving, setIsFormSaving] = useState(false);

  const savePreferences = async () => {
    setIsFormSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: t("Settings updated"),
        description: t("Your language and region preferences have been saved."),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("Failed to save preferences"),
        description: t("There was a problem updating your settings."),
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
          {t("common.languageRegion")}
        </CardTitle>
        <CardDescription>{t("Set your language and regional preferences")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="language" className="min-w-32">{t("common.displayLanguage")}</Label>
            <div className="flex-1">
              <Select 
                value={language} 
                onValueChange={setLanguage}
              >
                <SelectTrigger id="language" className={isMobile ? "w-full" : "w-[250px]"}>
                  <SelectValue placeholder={t("Select language")} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name} {lang.nativeName !== lang.name && `(${lang.nativeName})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="date-format" className="min-w-32 flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" /> {t("common.dateFormat")}
            </Label>
            <div className="flex-1">
              <Select 
                value={dateFormat} 
                onValueChange={(value) => setDateFormat(value as any)}
              >
                <SelectTrigger id="date-format" className={isMobile ? "w-full" : "w-[250px]"}>
                  <SelectValue placeholder={t("Select date format")} />
                </SelectTrigger>
                <SelectContent>
                  {dateFormats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="time-format" className="min-w-32 flex items-center gap-1">
              <Clock className="h-4 w-4" /> {t("common.timeFormat")}
            </Label>
            <div className="flex-1">
              <Select 
                value={timeFormat} 
                onValueChange={(value) => setTimeFormat(value as any)}
              >
                <SelectTrigger id="time-format" className={isMobile ? "w-full" : "w-[250px]"}>
                  <SelectValue placeholder={t("Select time format")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">{t("12-hour (AM/PM)")}</SelectItem>
                  <SelectItem value="24">{t("24-hour")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className={`flex ${isMobile ? 'justify-center' : 'justify-start'} pt-4`}>
          <Button onClick={savePreferences} disabled={isFormSaving} className={isMobile ? "w-full" : ""}>
            {isFormSaving ? t("Saving...") : t("common.savePreferences")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageRegionSettings;
