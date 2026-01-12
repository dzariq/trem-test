import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import schoolLogo from "@/assets/school-badge.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
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
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  CalendarIcon,
  Settings,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  startOfWeek,
  addWeeks,
  format,
  isWithinInterval,
  addDays,
  isSameWeek,
  eachDayOfInterval,
} from "date-fns";
import {
  getLessonPlanStatus,
  type LessonPlan,
} from "@/data/lessonPlanData";
import {
  getAcademicYears,
  getActiveYear,
  setActiveYear,
} from "@/data/weekConfigData";
import { useLessonPlans, useLessonPlanSubjects } from "@/hooks/useLessonPlans";
import { useAcademicFilters } from "@/hooks/useAcademicFilters";

// LocalStorage keys for persisting selections
const LS_LESSON_PLAN_YEAR = "lessonPlan_selectedYear";
const LS_LESSON_PLAN_SUBJECT = "lessonPlan_selectedSubject";
const LS_LESSON_PLAN_CLASS = "lessonPlan_selectedClass";

// Holiday periods (blocked weeks)
const holidayPeriods = [
  { start: new Date(2026, 2, 14), end: new Date(2026, 2, 22) }, // March school holiday
  { start: new Date(2026, 5, 27), end: new Date(2026, 6, 26) }, // June-July holiday
  { start: new Date(2026, 8, 5), end: new Date(2026, 8, 13) }, // September holiday
  { start: new Date(2026, 10, 14), end: new Date(2026, 11, 31) }, // Nov-Dec holiday
];

// Get week number from date
const getWeekNumber = (date: Date, termStart: Date): number => {
  const diffTime = date.getTime() - termStart.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks + 1;
};

// Check if a date is in a holiday period
const isHoliday = (date: Date): boolean => {
  return holidayPeriods.some((period) =>
    isWithinInterval(date, { start: period.start, end: period.end })
  );
};

// Get Monday to Friday of the week containing the date
const getSchoolWeek = (date: Date): { start: Date; end: Date } => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const weekEnd = addDays(weekStart, 4); // Friday
  return { start: weekStart, end: weekEnd };
};

// Check if any day in the school week is a holiday
const isWeekHoliday = (date: Date): boolean => {
  const { start, end } = getSchoolWeek(date);
  const weekDays = eachDayOfInterval({ start, end });
  return weekDays.some((day) => isHoliday(day));
};

const TeacherLessonPlansPage = () => {
  const navigate = useNavigate();
  
  // Load subjects from Supabase (same source as Academic module)
  const { subjectNames: dbSubjects, loading: subjectsLoading } = useLessonPlanSubjects();
  
  // Load classes from Supabase (same source as Academic module)
  const { 
    classes: dbClasses, 
    loadingClasses 
  } = useAcademicFilters();
  
  // Year selection (static for now, can be derived from academic_periods if needed)
  const academicYears = getAcademicYears();
  
  // Initialize state from localStorage or defaults
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const saved = localStorage.getItem(LS_LESSON_PLAN_YEAR);
    return saved || getActiveYear()?.id || academicYears[0]?.id || "";
  });
  
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    return localStorage.getItem(LS_LESSON_PLAN_SUBJECT) || "";
  });
  
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem(LS_LESSON_PLAN_CLASS) || "";
  });
  
  // Set defaults when data loads
  useEffect(() => {
    if (dbSubjects.length > 0 && !selectedSubject) {
      const defaultSubject = dbSubjects[0];
      setSelectedSubject(defaultSubject);
      localStorage.setItem(LS_LESSON_PLAN_SUBJECT, defaultSubject);
    }
  }, [dbSubjects, selectedSubject]);
  
  useEffect(() => {
    if (dbClasses.length > 0 && !selectedClass) {
      const defaultClass = dbClasses[0];
      setSelectedClass(defaultClass);
      localStorage.setItem(LS_LESSON_PLAN_CLASS, defaultClass);
    }
  }, [dbClasses, selectedClass]);
  
  // Persist selections to localStorage
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setActiveYear(year);
    localStorage.setItem(LS_LESSON_PLAN_YEAR, year);
  };
  
  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    localStorage.setItem(LS_LESSON_PLAN_SUBJECT, subject);
  };
  
  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    localStorage.setItem(LS_LESSON_PLAN_CLASS, cls);
  };
  
  // Use Supabase hook for lesson plans data
  const academicYearNum = parseInt(selectedYear) || 2026;
  const { 
    curriculum, 
    loading, 
    updateWeekNumber, 
    addTopic, 
    updateTopic 
  } = useLessonPlans(academicYearNum, selectedSubject, selectedClass);
  
  // Combined loading state for dropdowns
  const dropdownsLoading = subjectsLoading || loadingClasses;
  
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [isAddSubtopicOpen, setIsAddSubtopicOpen] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState<string>("");
  const [newSubtopicTitle, setNewSubtopicTitle] = useState("");
  const [weekCalendarOpen, setWeekCalendarOpen] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [editingDateField, setEditingDateField] = useState<"start" | "end" | null>(null);
  
  // Edit topic dialog state
  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string>("");
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [editSubtopics, setEditSubtopics] = useState<string[]>([]);
  const [newSubtopicInput, setNewSubtopicInput] = useState("");

  // Term start date (for week calculation)
  const termStart = new Date(2026, 0, 5); // January 5, 2026

  const handleWeekChange = async (weekId: string, selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    const { start, end } = getSchoolWeek(selectedDate);

    // Check if any day in the week is a holiday
    if (isWeekHoliday(selectedDate)) {
      toast({
        title: "Holiday Period",
        description: "This week includes a holiday period and cannot be selected.",
        variant: "destructive",
      });
      return;
    }

    const newWeekNumber = getWeekNumber(selectedDate, termStart);

    // Persist the selection to Supabase
    const success = await updateWeekNumber(weekId, newWeekNumber);
    
    if (success) {
      toast({
        title: "Week Changed",
        description: `Week updated to Week ${newWeekNumber} (${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")})`,
      });
    }
  };

  // Get week range for display
  const getWeekRange = (weekNumber: number): { start: Date; end: Date } => {
    const weekStart = addWeeks(termStart, weekNumber - 1);
    return getSchoolWeek(weekStart);
  };

  const getStatusIcon = (status: "complete" | "incomplete" | "draft" | "empty") => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case "incomplete":
        return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case "draft":
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: "complete" | "incomplete" | "draft" | "empty") => {
    switch (status) {
      case "complete":
        return "default";
      case "incomplete":
        return "secondary";
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleLessonPlanClick = (lp: LessonPlan) => {
    navigate(`/teacher/lesson-plans/${lp.id}`);
  };

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) return;
    
    // Save to Supabase
    await addTopic(newTopicTitle.trim());
    
    setNewTopicTitle("");
    setIsAddTopicOpen(false);
  };

  const handleOpenAddSubtopic = (topicId: string) => {
    setCurrentTopicId(topicId);
    setIsAddSubtopicOpen(true);
  };

  const handleAddSubtopic = () => {
    if (!newSubtopicTitle.trim()) return;
    
    const topic = curriculum?.topics.find(t => t.id === currentTopicId);
    // In a real app, this would save to the database
    toast({
      title: "Subtopic Added",
      description: `"${newSubtopicTitle}" has been added to ${topic?.title || "topic"}.`,
    });
    
    setNewSubtopicTitle("");
    setIsAddSubtopicOpen(false);
    setCurrentTopicId("");
  };

  const handleOpenEditTopic = (topic: { id: string; title: string; subtopics?: string[] }) => {
    setEditingTopicId(topic.id);
    setEditTopicTitle(topic.title);
    setEditSubtopics(topic.subtopics || []);
    setNewSubtopicInput("");
    setIsEditTopicOpen(true);
  };

  const handleSaveTopicEdit = async () => {
    if (!editTopicTitle.trim()) return;
    
    // Save to Supabase
    await updateTopic(editingTopicId, editTopicTitle.trim(), editSubtopics);
    
    setIsEditTopicOpen(false);
    setEditingTopicId("");
    setEditTopicTitle("");
    setEditSubtopics([]);
  };

  const handleAddEditSubtopic = () => {
    if (!newSubtopicInput.trim()) return;
    setEditSubtopics([...editSubtopics, newSubtopicInput.trim()]);
    setNewSubtopicInput("");
  };

  const handleRemoveEditSubtopic = (index: number) => {
    setEditSubtopics(editSubtopics.filter((_, i) => i !== index));
  };

  const handleRenameEditSubtopic = (index: number, newName: string) => {
    const updated = [...editSubtopics];
    updated[index] = newName;
    setEditSubtopics(updated);
  };

  const handleCreateNew = () => {
    navigate("/teacher/lesson-plans/new");
  };

  const renderLessonPlanItem = (lp: LessonPlan | undefined, lessonNumber: number, weekId: string) => {
    if (!lp) {
      return (
        <button
          onClick={() => navigate(`/teacher/lesson-plans/new?week=${weekId}&lesson=${lessonNumber}`)}
          className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors w-full"
        >
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-muted-foreground">Lesson {lessonNumber}</p>
            <p className="text-xs text-muted-foreground">Tap to create</p>
          </div>
        </button>
      );
    }

    const status = getLessonPlanStatus(lp);
    
    return (
      <button
        onClick={() => handleLessonPlanClick(lp)}
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg border transition-colors w-full text-left overflow-hidden",
          status === "complete" && "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50",
          status === "incomplete" && "border-amber-200 bg-amber-50/50 hover:bg-amber-50",
          status === "draft" && "border-border bg-muted/30 hover:bg-muted/50"
        )}
      >
        <div className={cn(
          "h-8 w-8 min-w-[2rem] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
          status === "complete" && "bg-emerald-500 text-white",
          status === "incomplete" && "bg-amber-500 text-white",
          status === "draft" && "bg-muted text-muted-foreground"
        )}>
          {lessonNumber}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium truncate">{lp.title}</p>
          <p className="text-xs text-muted-foreground truncate">{lp.subtopics?.join(", ") || "No subtopic"}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>
    );
  };

  return (
    <TeacherAppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Lesson Plans</h1>
          </div>
        }
      />
      <div className="flex flex-col h-full min-h-0 overflow-x-hidden">
        {/* Header with Year and Subject Selector */}
          <div className="px-4 py-3 border-b border-border bg-card/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Year Selector */}
                <Select 
                  value={selectedYear} 
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Subject Selector - from Supabase */}
                <Select 
                  value={selectedSubject} 
                  onValueChange={handleSubjectChange}
                  disabled={subjectsLoading}
                >
                  <SelectTrigger className="w-[120px] sm:w-[150px]">
                    {subjectsLoading ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Loading...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Subject" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {dbSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Class Selector - from Supabase (same as Academic) */}
                <Select 
                  value={selectedClass} 
                  onValueChange={handleClassChange}
                  disabled={loadingClasses}
                >
                  <SelectTrigger className="w-20">
                    {loadingClasses ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </div>
                    ) : (
                      <SelectValue placeholder="Class" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {dbClasses.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setIsAddTopicOpen(true)}
                className="gap-2 self-start sm:self-auto"
              >
                <Plus className="h-5 w-5" />
                New Topic
              </Button>
            </div>
          </div>

          {/* Topics and Weeks List */}
          <ScrollArea className="flex-1 min-h-0 overflow-hidden">
            <div className="px-4 py-4 space-y-4 w-full max-w-full min-w-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading lesson plans...</p>
                  </div>
                </div>
              ) : !curriculum?.topics.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Topics Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating your first topic for {selectedSubject}
                  </p>
                  <Button onClick={() => setIsAddTopicOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Topic
                  </Button>
                </div>
              ) : curriculum?.topics.map((topic, topicIndex) => (
              <Card key={topic.id} className="overflow-hidden w-full">
                <CardHeader className="py-0 px-0 overflow-hidden space-y-0">
                  {/* Topic Title Section - Primary Green */}
                  <div className="py-3 px-4 bg-primary">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-primary-foreground truncate">
                          Topic {topicIndex + 1}: {topic.title}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
                        onClick={() => handleOpenEditTopic(topic)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Subtopics Section - Same dark green as topic */}
                  <div className="py-2 px-4 bg-primary border-b border-primary-foreground/20">
                    <Collapsible defaultOpen={false}>
                      <div className="flex items-center">
                        <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-primary-foreground hover:text-primary-foreground/80 transition-colors [&[data-state=open]>svg]:rotate-180">
                          <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                          Subtopics ({topic.subtopics?.length || 0})
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="mt-2">
                        <div className="flex flex-wrap gap-1.5 min-w-0">
                          {topic.subtopics && topic.subtopics.length > 0 ? (
                            topic.subtopics.map((subtopic, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs font-normal max-w-full min-w-0 overflow-hidden bg-primary-foreground/20 text-primary-foreground"
                              >
                                <span className="block truncate">{subtopic}</span>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-primary-foreground/70 italic">No subtopics added</span>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                  <Accordion type="multiple" className="w-full overflow-hidden">
                    {topic.weeks.map((week) => {
                      const lpCount = week.lessonPlans.length;
                      const completedCount = week.lessonPlans.filter(
                        lp => getLessonPlanStatus(lp) === "complete"
                      ).length;
                      
                      return (
                        <AccordionItem 
                          key={week.id} 
                          value={week.id}
                          className="border-b last:border-b-0 overflow-hidden"
                        >
                          <AccordionTrigger className="relative px-4 py-3 pr-10 hover:no-underline hover:bg-muted/20 [&>svg]:absolute [&>svg]:right-3 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg]:shrink-0">
                            <div className="flex flex-col gap-2 w-full min-w-0 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Popover 
                                  open={weekCalendarOpen === week.id} 
                                  onOpenChange={(open) => {
                                    setWeekCalendarOpen(open ? week.id : null);
                                    if (open) {
                                      const weekRange = getWeekRange(week.weekNumber);
                                      setDateRange({ from: weekRange.start, to: weekRange.end });
                                      setEditingDateField(null); // Start with no calendar shown
                                    } else {
                                      setDateRange({ from: undefined, to: undefined });
                                      setEditingDateField(null);
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <button className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background hover:bg-muted text-xs font-normal flex-shrink-0 transition-colors">
                                      <CalendarIcon className="h-3 w-3" />
                                      Week {week.weekNumber}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 z-50" align="start" onClick={(e) => e.stopPropagation()}>
                                    <div className="p-3 border-b border-border space-y-3">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Week Date Range</p>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (dateRange.from && dateRange.to) {
                                              setDateRange({ from: dateRange.to, to: dateRange.from });
                                            }
                                          }}
                                          disabled={!dateRange.from || !dateRange.to}
                                        >
                                          <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                          </svg>
                                          Swap
                                        </Button>
                                      </div>
                                      
                                      {/* Date Range Buttons - Click to show calendar */}
                                      <div className="flex items-stretch gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingDateField(editingDateField === "start" ? null : "start");
                                          }}
                                          className={cn(
                                            "flex-1 text-center p-3 rounded-lg border-2 transition-all min-h-[72px] flex flex-col justify-center",
                                            editingDateField === "start" 
                                              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                              : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                                          )}
                                        >
                                          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Start Date</p>
                                          <p className={cn(
                                            "text-sm font-semibold whitespace-nowrap",
                                            editingDateField === "start" && "text-primary"
                                          )}>
                                            {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : "Select"}
                                          </p>
                                        </button>
                                        
                                        <div className="text-muted-foreground text-sm flex items-center">→</div>
                                        
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingDateField(editingDateField === "end" ? null : "end");
                                          }}
                                          className={cn(
                                            "flex-1 text-center p-3 rounded-lg border-2 transition-all min-h-[72px] flex flex-col justify-center",
                                            editingDateField === "end" 
                                              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                              : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                                          )}
                                        >
                                          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">End Date</p>
                                          <p className={cn(
                                            "text-sm font-semibold whitespace-nowrap",
                                            editingDateField === "end" && "text-primary"
                                          )}>
                                            {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "Select"}
                                          </p>
                                        </button>
                                      </div>
                                      
                                      {!editingDateField && (
                                        <p className="text-xs text-muted-foreground text-center">
                                          Tap Start or End to edit
                                        </p>
                                      )}
                                    </div>
                                    
                                    {/* Calendar - Only shows when a date field is selected */}
                                    {editingDateField && (
                                      <div className="border-b border-border">
                                        <div className="px-3 pt-2 pb-1">
                                          <p className="text-xs font-medium text-primary">
                                            Selecting {editingDateField === "start" ? "Start" : "End"} Date
                                          </p>
                                        </div>
                                        <Calendar
                                          mode="single"
                                          defaultMonth={editingDateField === "start" 
                                            ? (dateRange.from || addWeeks(termStart, week.weekNumber - 1))
                                            : (dateRange.to || addWeeks(termStart, week.weekNumber - 1))
                                          }
                                          selected={editingDateField === "start" ? dateRange.from : dateRange.to}
                                          onSelect={(date) => {
                                            if (date) {
                                              if (editingDateField === "start") {
                                                setDateRange(prev => ({ ...prev, from: date }));
                                              } else {
                                                setDateRange(prev => ({ ...prev, to: date }));
                                              }
                                              setEditingDateField(null); // Close calendar after selection
                                            }
                                          }}
                                          disabled={(date) => {
                                            const day = date.getDay();
                                            return day === 0 || day === 6 || isHoliday(date);
                                          }}
                                          className={cn("p-3 pointer-events-auto")}
                                          modifiers={{
                                            holiday: (date) => isHoliday(date),
                                            rangeStart: dateRange.from ? [dateRange.from] : [],
                                            rangeEnd: dateRange.to ? [dateRange.to] : [],
                                          }}
                                          modifiersStyles={{
                                            holiday: {
                                              backgroundColor: "hsl(var(--destructive) / 0.1)",
                                              color: "hsl(var(--muted-foreground))",
                                              textDecoration: "line-through",
                                            },
                                          }}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Apply Button */}
                                    <div className="p-3 flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setWeekCalendarOpen(null);
                                          setEditingDateField(null);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        className="flex-1"
                                        size="sm"
                                        disabled={!dateRange.from || !dateRange.to}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (dateRange.from && dateRange.to) {
                                            const start = dateRange.from < dateRange.to ? dateRange.from : dateRange.to;
                                            handleWeekChange(week.id, start);
                                            setWeekCalendarOpen(null);
                                            setDateRange({ from: undefined, to: undefined });
                                            setEditingDateField(null);
                                          }
                                        }}
                                      >
                                        Apply
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                {(() => {
                                  const weekSubtopics = [...new Set(
                                    week.lessonPlans.flatMap(lp => lp.subtopics || []).filter(Boolean)
                                  )];
                                  return weekSubtopics.length > 0 ? (
                                     <div className="flex flex-wrap gap-1.5 min-w-0">
                                       {weekSubtopics.map((subtopic, idx) => (
                                         <Badge
                                           key={idx}
                                           variant="outline"
                                           className="text-xs font-normal px-2 py-0.5 max-w-full"
                                         >
                                           <span className="block truncate max-w-[14rem]">{subtopic}</span>
                                         </Badge>
                                       ))}
                                     </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">
                                      No subtopics
                                    </span>
                                  );
                                })()}
                              </div>
                              {(() => {
                                const total = lpCount > 0 ? lpCount : 5;
                                const isAllComplete = completedCount === total && total > 0;
                                const isNoneComplete = completedCount === 0;
                                
                                return (
                                  <Badge 
                                    variant="secondary" 
                                    className={cn(
                                      "text-xs shrink-0",
                                      isAllComplete && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                                      isNoneComplete && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                                      !isAllComplete && !isNoneComplete && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                    )}
                                  >
                                    {completedCount}/{total}
                                  </Badge>
                                );
                              })()}
                            </div>
                          </AccordionTrigger>
                            <AccordionContent className="px-4 pb-3">
                              {/* Week Date Range Header */}
                              {(() => {
                                const weekRange = getWeekRange(week.weekNumber);
                                return (
                                  <div className="flex items-center gap-2 pt-2 pb-3 border-b border-border/50 mb-3">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {format(weekRange.start, "EEE, MMM d")} – {format(weekRange.end, "EEE, MMM d, yyyy")}
                                    </span>
                                  </div>
                                );
                              })()}
                              <div className="space-y-2">
                                {[1, 2, 3, 4, 5].map((lessonNum) => {
                                const lp = week.lessonPlans.find(p => p.lessonNumber === lessonNum);
                                return (
                                  <div key={lessonNum}>
                                    {renderLessonPlanItem(lp, lessonNum, week.id)}
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Week Summary */}
                            {week.lessonPlans.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                    <span>{week.lessonPlans.filter(lp => getLessonPlanStatus(lp) === "complete").length} Complete</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                    <span>{week.lessonPlans.filter(lp => getLessonPlanStatus(lp) === "incomplete").length} Incomplete</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span>{week.lessonPlans.filter(lp => getLessonPlanStatus(lp) === "draft").length} Draft</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {/* Empty state is now handled in the conditional above */}
          </div>
        </ScrollArea>
      </div>

      {/* Add Topic Dialog */}
      <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
            <DialogDescription>
              Create a new topic for {selectedSubject}. Topics are automatically numbered.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic-title">Topic Title</Label>
              <Input
                id="topic-title"
                placeholder="e.g., Linear Equations"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This will be added as Topic {(curriculum?.topics.length || 0) + 1}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTopicOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTopic} disabled={!newTopicTitle.trim()}>
              Add Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subtopic Dialog */}
      <Dialog open={isAddSubtopicOpen} onOpenChange={setIsAddSubtopicOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Subtopic</DialogTitle>
            <DialogDescription>
              Add a new subtopic to "{curriculum?.topics.find(t => t.id === currentTopicId)?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subtopic-title">Subtopic Title</Label>
              <Input
                id="subtopic-title"
                placeholder="e.g., Solving Quadratic Equations"
                value={newSubtopicTitle}
                onChange={(e) => setNewSubtopicTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSubtopicOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubtopic} disabled={!newSubtopicTitle.trim()}>
              Add Subtopic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog open={isEditTopicOpen} onOpenChange={setIsEditTopicOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>
              Edit the topic name and manage subtopics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-topic-title">Topic Name</Label>
              <Input
                id="edit-topic-title"
                value={editTopicTitle}
                onChange={(e) => setEditTopicTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Subtopics</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {editSubtopics.map((subtopic, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={subtopic}
                      onChange={(e) => handleRenameEditSubtopic(idx, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveEditSubtopic(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {editSubtopics.length === 0 && (
                  <p className="text-sm text-muted-foreground italic py-2">No subtopics added yet.</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="New subtopic name..."
                  value={newSubtopicInput}
                  onChange={(e) => setNewSubtopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddEditSubtopic();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddEditSubtopic}
                  disabled={!newSubtopicInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTopicOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTopicEdit} disabled={!editTopicTitle.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherAppLayout>
  );
};

export default TeacherLessonPlansPage;
