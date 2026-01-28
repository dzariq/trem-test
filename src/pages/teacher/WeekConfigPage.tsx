import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Calendar, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  getAcademicYears,
  getActiveYear,
  setActiveYear,
  createAcademicYear,
  updateAllWeeksForYear,
  type AcademicYear,
  type WeekConfig,
} from "@/data/weekConfigData";

const WeekConfigPage = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(getAcademicYears());
  const [selectedYearId, setSelectedYearId] = useState<string>(getActiveYear()?.id || "");
  const [weeks, setWeeks] = useState<WeekConfig[]>(getActiveYear()?.weeks || []);
  const [hasChanges, setHasChanges] = useState(false);

  const handleYearChange = (yearId: string) => {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Switch anyway?")) {
        return;
      }
    }
    setSelectedYearId(yearId);
    setActiveYear(yearId);
    const year = academicYears.find(y => y.id === yearId);
    setWeeks(year?.weeks || []);
    setHasChanges(false);
  };

  const handleWeekDateChange = (weekNumber: number, field: "startDate" | "endDate", value: string) => {
    setWeeks(prev => prev.map(w => 
      w.weekNumber === weekNumber ? { ...w, [field]: value } : w
    ));
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    updateAllWeeksForYear(selectedYearId, weeks);
    setHasChanges(false);
    toast.success("Week configurations saved successfully");
  };

  const handleCreateYear = () => {
    // Find the next year number
    const existingYears = academicYears.map(y => y.startYear);
    const nextYear = existingYears.length > 0 ? Math.max(...existingYears) + 1 : new Date().getFullYear();
    
    const newYear = createAcademicYear(nextYear);
    
    setAcademicYears(getAcademicYears());
    setSelectedYearId(newYear.id);
    setActiveYear(newYear.id);
    setWeeks(newYear.weeks);
    setHasChanges(false);
    toast.success(`Academic year "${nextYear}" created`);
  };

  return (
    <TeacherAppLayout>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold">Academic Week Configuration</h1>
              <p className="text-xs text-muted-foreground">
                Configure week dates for lesson planning
              </p>
            </div>
          </div>
          
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={!hasChanges}
            className="h-8 gap-1"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Year Selection & Actions */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Year:</Label>
            <Select value={selectedYearId} onValueChange={handleYearChange}>
              <SelectTrigger className="w-24 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleCreateYear} className="h-9 gap-1">
            <Plus className="h-3.5 w-3.5" />
            New Year
          </Button>
        </div>
      </div>

      {/* Weeks Table */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="p-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Week Schedule ({selectedYearId})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="grid grid-cols-[80px_1fr_1fr] gap-2 px-4 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
                <div>Week</div>
                <div>Start Date</div>
                <div>End Date</div>
              </div>
              
              {/* Table Rows */}
              <div className="divide-y divide-border">
                {weeks.map((week) => (
                  <div
                    key={week.weekNumber}
                    className="grid grid-cols-[80px_1fr_1fr] gap-2 px-4 py-2 items-center hover:bg-muted/30"
                  >
                    <div className="text-sm font-medium">Week {week.weekNumber}</div>
                    <div>
                      <Input
                        type="date"
                        value={week.startDate}
                        onChange={(e) => handleWeekDateChange(week.weekNumber, "startDate", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        value={week.endDate}
                        onChange={(e) => handleWeekDateChange(week.weekNumber, "endDate", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </TeacherAppLayout>
  );
};

export default WeekConfigPage;
