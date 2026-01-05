import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
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
  Plus, 
  ChevronRight, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { startOfWeek, endOfWeek, addWeeks, format, isWithinInterval, addDays, isSameWeek, eachDayOfInterval } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  mockLessonPlans, 
  getAvailableSubjects, 
  getLessonPlanStatus,
  type LessonPlan,
  type SubjectCurriculum 
} from "@/data/lessonPlanData";

// Holiday periods (blocked weeks)
const holidayPeriods = [
  { start: new Date(2026, 2, 14), end: new Date(2026, 2, 22) }, // March school holiday
  { start: new Date(2026, 5, 27), end: new Date(2026, 6, 26) }, // June-July holiday
  { start: new Date(2026, 8, 5), end: new Date(2026, 8, 13) },  // September holiday
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
  return holidayPeriods.some(period => 
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
  return weekDays.some(day => isHoliday(day));
};

const TeacherLessonPlansPage = () => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string>(mockLessonPlans[0]?.subject || "");
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [isAddSubtopicOpen, setIsAddSubtopicOpen] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState<string>("");
  const [newSubtopicTitle, setNewSubtopicTitle] = useState("");
  const [weekCalendarOpen, setWeekCalendarOpen] = useState<string | null>(null);
  
  // Term start date (for week calculation)
  const termStart = new Date(2026, 0, 5); // January 5, 2026
  
  const subjects = getAvailableSubjects();
  const curriculum = mockLessonPlans.find(s => s.subject === selectedSubject);

  const handleWeekChange = (weekId: string, selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    const { start, end } = getSchoolWeek(selectedDate);
    
    // Check if any day in the week is a holiday
    if (isWeekHoliday(selectedDate)) {
      toast({
        title: "Holiday Period",
        description: "This week includes a holiday period and cannot be selected.",
        variant: "destructive"
      });
      return;
    }
    
    const newWeekNumber = getWeekNumber(selectedDate, termStart);
    toast({
      title: "Week Changed",
      description: `Week updated to Week ${newWeekNumber} (${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")})`,
    });
    setWeekCalendarOpen(null);
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

  const handleAddTopic = () => {
    if (!newTopicTitle.trim()) return;
    
    // In a real app, this would save to the database
    toast({
      title: "Topic Created",
      description: `Topic "${newTopicTitle}" has been added to ${selectedSubject}.`,
    });
    
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
          <p className="text-xs text-muted-foreground truncate">{lp.topic}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>
    );
  };

  return (
      <TeacherAppLayout>
        <div className="flex flex-col h-full min-h-0">
          {/* Header with Subject Selector */}
          <div className="px-4 py-3 border-b border-border bg-card/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={() => setIsAddTopicOpen(true)}
                className="gap-1.5 self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Topic</span>
              </Button>
            </div>
          </div>

          {/* Topics and Weeks List */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-4">
              {curriculum?.topics.map((topic, topicIndex) => (
              <Card key={topic.id} className="overflow-hidden w-full">
                <CardHeader className="py-3 px-4 bg-muted/30">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                      <CardTitle className="text-sm font-semibold truncate">
                        Topic {topicIndex + 1}: {topic.title}
                      </CardTitle>
                    </div>
                  </div>
                  
                  {/* Subtopics Section */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Subtopics:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleOpenAddSubtopic(topic.id)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {topic.subtopics && topic.subtopics.length > 0 ? (
                        topic.subtopics.map((subtopic, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs font-normal max-w-full"
                          >
                            <span className="truncate">{subtopic}</span>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No subtopics added</span>
                      )}
                    </div>
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
                                  onOpenChange={(open) => setWeekCalendarOpen(open ? week.id : null)}
                                >
                                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <button className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background hover:bg-muted text-xs font-normal flex-shrink-0 transition-colors">
                                      <CalendarIcon className="h-3 w-3" />
                                      Week {week.weekNumber}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 z-50" align="start" onClick={(e) => e.stopPropagation()}>
                                    <div className="p-2 border-b border-border">
                                      <p className="text-xs font-medium">Select Week (Mon-Fri)</p>
                                      <p className="text-xs text-muted-foreground">Click any day to select the school week</p>
                                    </div>
                                    <Calendar
                                      mode="single"
                                      selected={addWeeks(termStart, week.weekNumber - 1)}
                                      onSelect={(date) => handleWeekChange(week.id, date)}
                                      disabled={(date) => {
                                        // Disable weekends and holidays
                                        const day = date.getDay();
                                        return day === 0 || day === 6 || isHoliday(date);
                                      }}
                                      className={cn("p-3 pointer-events-auto")}
                                      modifiers={{
                                        holiday: (date) => isHoliday(date),
                                        selectedWeek: (date) => {
                                          const currentWeekStart = addWeeks(termStart, week.weekNumber - 1);
                                          return isSameWeek(date, currentWeekStart, { weekStartsOn: 1 });
                                        }
                                      }}
                                      modifiersStyles={{
                                        holiday: { 
                                          backgroundColor: 'hsl(var(--destructive) / 0.1)',
                                          color: 'hsl(var(--muted-foreground))',
                                          textDecoration: 'line-through'
                                        },
                                        selectedWeek: {
                                          backgroundColor: 'hsl(var(--primary) / 0.15)',
                                          fontWeight: 600
                                        }
                                      }}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <span className="text-sm font-medium truncate min-w-0">{week.title}</span>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className="text-xs shrink-0"
                              >
                                {completedCount}/{lpCount > 0 ? lpCount : 5}
                              </Badge>
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

            {(!curriculum || curriculum.topics.length === 0) && (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No lesson plans found for this subject.</p>
                <Button className="mt-4" onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Lesson Plan
                </Button>
              </Card>
            )}
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
    </TeacherAppLayout>
  );
};

export default TeacherLessonPlansPage;
