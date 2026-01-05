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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Calendar, Wand2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  getAcademicYears,
  getActiveYear,
  setActiveYear,
  createAcademicYear,
  updateAllWeeksForYear,
  autoFillWeeksFromStart,
  type AcademicYear,
  type WeekConfig,
} from "@/data/weekConfigData";

const WeekConfigPage = () => {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(getAcademicYears());
  const [selectedYearId, setSelectedYearId] = useState<string>(getActiveYear()?.id || "");
  const [weeks, setWeeks] = useState<WeekConfig[]>(getActiveYear()?.weeks || []);
  const [hasChanges, setHasChanges] = useState(false);
  
  // New year dialog state
  const [newYearDialogOpen, setNewYearDialogOpen] = useState(false);
  const [newYearName, setNewYearName] = useState("");
  const [newYearStartDate, setNewYearStartDate] = useState("");
  const [copyFromYear, setCopyFromYear] = useState<string>("");

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

  const handleAutoFill = () => {
    const week1 = weeks.find(w => w.weekNumber === 1);
    if (!week1?.startDate) {
      toast.error("Please set Week 1 start date first");
      return;
    }
    
    const startDate = new Date(week1.startDate);
    const newWeeks: WeekConfig[] = [];
    
    for (let i = 1; i <= 50; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (i - 1) * 7);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      
      newWeeks.push({
        weekNumber: i,
        startDate: weekStart.toISOString().split("T")[0],
        endDate: weekEnd.toISOString().split("T")[0],
      });
    }
    
    setWeeks(newWeeks);
    setHasChanges(true);
    toast.success("All weeks auto-filled from Week 1");
  };

  const handleSaveAll = () => {
    updateAllWeeksForYear(selectedYearId, weeks);
    setHasChanges(false);
    toast.success("Week configurations saved successfully");
  };

  const handleCreateYear = () => {
    if (!newYearName.trim()) {
      toast.error("Please enter a year name");
      return;
    }
    if (!newYearStartDate) {
      toast.error("Please select a start date");
      return;
    }
    
    const newYear = createAcademicYear(
      newYearName,
      new Date(newYearStartDate),
      copyFromYear || undefined
    );
    
    setAcademicYears(getAcademicYears());
    setSelectedYearId(newYear.id);
    setActiveYear(newYear.id);
    setWeeks(newYear.weeks);
    setNewYearDialogOpen(false);
    setNewYearName("");
    setNewYearStartDate("");
    setCopyFromYear("");
    toast.success(`Academic year "${newYearName}" created`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
              <SelectTrigger className="w-32 h-9">
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
          
          <Dialog open={newYearDialogOpen} onOpenChange={setNewYearDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <Plus className="h-3.5 w-3.5" />
                New Year
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Academic Year</DialogTitle>
                <DialogDescription>
                  Set up a new academic year with 50 weeks of dates.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Year Name</Label>
                  <Input
                    placeholder="e.g., 2027-2028"
                    value={newYearName}
                    onChange={(e) => setNewYearName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Week 1 Start Date</Label>
                  <Input
                    type="date"
                    value={newYearStartDate}
                    onChange={(e) => setNewYearStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Copy Dates From (Optional)</Label>
                  <Select value={copyFromYear} onValueChange={setCopyFromYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Generate fresh dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Generate fresh dates</SelectItem>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          Copy from {year.name} (+1 year offset)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewYearDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateYear}>Create Year</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={handleAutoFill} className="h-9 gap-1">
            <Wand2 className="h-3.5 w-3.5" />
            Auto-fill from Week 1
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
