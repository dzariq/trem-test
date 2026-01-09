import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Save, 
  FileDown, 
  Printer,
  BookOpen,
  Calendar,
  User,
  GraduationCap,
  Users,
  FileText,
  ClipboardList,
  Check,
  ChevronsUpDown,
  Settings,
  Pencil,
  Eye,
  Maximize2,
  Minimize2,
  ChevronUp,
  Target,
  Clock,
  Package,
  Home as HomeIcon,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TagInput } from "@/components/lessonplan/TagInput";
import { LessonFlowEditor } from "@/components/lessonplan/LessonFlowEditor";
import { ObjectivesEditor } from "@/components/lessonplan/ObjectivesEditor";
import { ApprovalSection } from "@/components/lessonplan/ApprovalSection";
import { ReflectionSection } from "@/components/lessonplan/ReflectionSection";
import { CollapsibleSection } from "@/components/lessonplan/CollapsibleSection";
import { SectionNavigation } from "@/components/lessonplan/SectionNavigation";
import { 
  getLessonPlanById, 
  createEmptyLessonPlan,
  getSubtopicsForTopic,
  getPreviousLessonPlan,
  type LessonPlan 
} from "@/data/lessonPlanData";
import { allSubjects } from "@/data/subjectsConfig";
import { teacherProfile } from "@/data/teacherMockData";
import { getWeekConfigs, formatWeekDateRange, getLessonDate } from "@/data/weekConfigData";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const sections = [
  { id: "basic-info", title: "Basic Information", shortTitle: "Basic" },
  { id: "objectives", title: "Learning Objectives", shortTitle: "Objectives" },
  { id: "vocabulary", title: "Vocabulary", shortTitle: "Vocab" },
  { id: "previous", title: "Previous Learning", shortTitle: "Previous" },
  { id: "lesson-flow", title: "Lesson Flow", shortTitle: "Flow" },
  { id: "resources", title: "Resources", shortTitle: "Resources" },
  { id: "homework", title: "Homework", shortTitle: "HW" },
  { id: "reflection", title: "Reflection", shortTitle: "Reflect" },
  { id: "attendance", title: "Attendance", shortTitle: "Attend" },
];

const LessonPlanDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const isNew = id === "new";
  const weekParam = searchParams.get("week");
  const lessonParam = searchParams.get("lesson");

  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("basic-info");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const shakeEditButton = () => {
    if (editButtonRef.current && !isEditMode) {
      editButtonRef.current.classList.add("animate-shake");
      setTimeout(() => {
        editButtonRef.current?.classList.remove("animate-shake");
      }, 500);
    }
  };

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 300);
      
      // Update active section based on scroll position
      const scrollTop = scrollRef.current.scrollTop + 100;
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i].id);
        if (element && element.offsetTop <= scrollTop) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    }
  }, []);

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isNew) {
      const newLP = createEmptyLessonPlan(
        [teacherProfile.name],
        teacherProfile.classes[0] || "",
        "Mathematics",
        "",
        parseInt(weekParam || "1"),
        parseInt(lessonParam || "1")
      );
      setLessonPlan(newLP);
      setIsEditMode(true);
    } else if (id) {
      const existingLP = getLessonPlanById(id);
      if (existingLP) {
        setLessonPlan(existingLP);
        setIsEditMode(false);
      } else {
        toast.error("Lesson plan not found");
        navigate("/teacher/lesson-plans");
      }
    }
  }, [id, isNew, weekParam, lessonParam, navigate]);

  const updateField = <K extends keyof LessonPlan>(field: K, value: LessonPlan[K]) => {
    if (lessonPlan) {
      setLessonPlan({ ...lessonPlan, [field]: value, updatedAt: new Date().toISOString() });
    }
  };

  const handleSave = async () => {
    if (!lessonPlan) return;
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success("Lesson plan saved successfully");
    setIsSaving(false);
  };

  const handleExportPDF = async () => {
    if (!printRef.current || !lessonPlan) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`lesson-plan-${lessonPlan.title || "untitled"}.pdf`);
      
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
    }
    setIsExporting(false);
  };

  if (!lessonPlan) {
    return (
      <TeacherAppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </TeacherAppLayout>
    );
  }

  const headerContent = (
    <>
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-20 bg-background border-b border-border transition-all duration-300",
        isFocusMode && "shadow-md"
      )}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {!isFocusMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/teacher/lesson-plans")}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-sm font-semibold line-clamp-1">
                {isNew ? "New Lesson Plan" : lessonPlan.title || "Untitled"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Week {lessonPlan.weekNumber} • LP {lessonPlan.lessonNumber}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="h-8 w-8 p-0"
              title={isFocusMode ? "Exit focus mode" : "Focus mode"}
            >
              {isFocusMode ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            {!isEditMode ? (
              <Button
                ref={editButtonRef}
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="h-8 gap-1"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(false)}
                className="h-8 gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="h-8 gap-1"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            {isEditMode && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 gap-1"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            )}
          </div>
        </div>

        {/* Section Navigation */}
        <div className="px-4 pb-2">
          <SectionNavigation
            sections={sections}
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          />
        </div>
      </div>
    </>
  );

  const mainContent = (
    <div 
      ref={scrollRef}
      className={cn(
        "overflow-y-auto",
        isFocusMode ? "h-[calc(100vh-120px)]" : "h-[calc(100vh-180px)]"
      )}
      onScroll={handleScroll}
    >
      <div ref={printRef} className="p-4 space-y-4 bg-background">
        {/* Section 1: Basic Information */}
        <CollapsibleSection
          id="basic-info"
          title="Basic Information"
          icon={FileText}
          sectionNumber={1}
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => navigate("/teacher/week-config")}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          }
        >
          <div className="space-y-4">
            {/* Lesson Title */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lesson Title</Label>
              {isEditMode ? (
                <Input
                  value={lessonPlan.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Enter lesson title..."
                  className="h-10"
                />
              ) : (
                <div 
                  className="h-10 px-3 flex items-center rounded-md border border-input bg-background text-sm cursor-pointer"
                  onClick={shakeEditButton}
                >
                  {lessonPlan.title || <span className="italic text-muted-foreground">No title</span>}
                </div>
              )}
            </div>

            {/* Subject & Topic */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <div 
                  className="h-9 px-3 flex items-center rounded-md border border-input bg-background text-sm cursor-pointer"
                  onClick={shakeEditButton}
                >
                  {lessonPlan.subject || <span className="italic text-muted-foreground">No subject</span>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Topic</Label>
                <div 
                  className="h-9 px-3 flex items-center rounded-md border border-input bg-background text-sm truncate cursor-pointer"
                  onClick={shakeEditButton}
                >
                  {lessonPlan.topic || <span className="italic text-muted-foreground">No topic</span>}
                </div>
              </div>
            </div>

            {/* Subtopics */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Subtopics</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-auto min-h-9 justify-between text-left font-normal"
                  >
                    <div className="flex flex-wrap gap-1">
                      {lessonPlan.subtopics && lessonPlan.subtopics.length > 0 ? (
                        lessonPlan.subtopics.map((subtopic) => (
                          <Badge key={subtopic} variant="secondary" className="text-xs">
                            {subtopic}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Select subtopics...</span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-2 space-y-2">
                    <div className="flex gap-2 pb-2 border-b border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const allSubtopics = getSubtopicsForTopic(lessonPlan.subject, lessonPlan.topic);
                          updateField("subtopics", allSubtopics);
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => updateField("subtopics", [])}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {getSubtopicsForTopic(lessonPlan.subject, lessonPlan.topic).map((subtopic) => {
                        const isSelected = lessonPlan.subtopics?.includes(subtopic) || false;
                        return (
                          <div
                            key={subtopic}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                            onClick={() => {
                              const currentSubtopics = lessonPlan.subtopics || [];
                              if (isSelected) {
                                updateField("subtopics", currentSubtopics.filter(s => s !== subtopic));
                              } else {
                                updateField("subtopics", [...currentSubtopics, subtopic]);
                              }
                            }}
                          >
                            <Checkbox checked={isSelected} />
                            <span className="text-sm">{subtopic}</span>
                          </div>
                        );
                      })}
                      {getSubtopicsForTopic(lessonPlan.subject, lessonPlan.topic).length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">No subtopics available.</p>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Week, Lesson, Date, Class */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Week</Label>
                {isEditMode ? (
                  <Select 
                    value={lessonPlan.weekNumber.toString()} 
                    onValueChange={(v) => {
                      const weekNum = parseInt(v);
                      updateField("weekNumber", weekNum);
                      const newDate = getLessonDate(weekNum, lessonPlan.lessonNumber);
                      if (newDate) updateField("date", newDate);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-60">
                        {getWeekConfigs().map((week) => (
                          <SelectItem key={week.weekNumber} value={week.weekNumber.toString()}>
                            W{week.weekNumber}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                ) : (
                  <div 
                    className="h-9 px-3 flex items-center rounded-md border border-input bg-background text-sm cursor-pointer"
                    onClick={shakeEditButton}
                  >
                    W{lessonPlan.weekNumber}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Lesson</Label>
                {isEditMode ? (
                  <Select 
                    value={lessonPlan.lessonNumber.toString()} 
                    onValueChange={(v) => {
                      const lessonNum = parseInt(v);
                      updateField("lessonNumber", lessonNum);
                      const newDate = getLessonDate(lessonPlan.weekNumber, lessonNum);
                      if (newDate) updateField("date", newDate);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          L{num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div 
                    className="h-9 px-3 flex items-center rounded-md border border-input bg-background text-sm cursor-pointer"
                    onClick={shakeEditButton}
                  >
                    L{lessonPlan.lessonNumber}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={lessonPlan.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="h-9 w-full [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Class</Label>
                {isEditMode ? (
                  <Select 
                    value={lessonPlan.className} 
                    onValueChange={(v) => updateField("className", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherProfile.classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div 
                    className="h-9 px-3 flex items-center rounded-md border border-input bg-background text-sm cursor-pointer"
                    onClick={shakeEditButton}
                  >
                    {lessonPlan.className}
                  </div>
                )}
              </div>
            </div>

            {/* Teacher(s) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Teacher(s)</Label>
              <div 
                className="flex flex-wrap gap-1.5 min-h-9 items-center px-3 py-2 rounded-md border border-input bg-background cursor-pointer"
                onClick={shakeEditButton}
              >
                {lessonPlan.teacherNames.map((name, idx) => {
                  const isCurrentTeacher = name === teacherProfile.name;
                  return (
                    <Badge 
                      key={idx} 
                      variant={isCurrentTeacher ? "default" : "secondary"} 
                      className={cn(
                        "text-xs",
                        isCurrentTeacher && "ring-2 ring-primary/30"
                      )}
                    >
                      {name}
                      {isCurrentTeacher && <span className="ml-1 text-[10px] opacity-75">(You)</span>}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 2: Learning Objectives */}
        <div id="objectives">
          <ObjectivesEditor
            objectives={lessonPlan.learningObjectives}
            onChange={(objectives) => updateField("learningObjectives", objectives)}
            isEditMode={isEditMode}
          />
        </div>

        {/* Section 3: Vocabulary / Terminology */}
        <CollapsibleSection
          id="vocabulary"
          title="Formula / Vocabulary / Terminology"
          icon={BookOpen}
          sectionNumber={3}
          badge={
            lessonPlan.vocabulary.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {lessonPlan.vocabulary.length}
              </Badge>
            )
          }
        >
          <TagInput
            tags={lessonPlan.vocabulary}
            onChange={(tags) => updateField("vocabulary", tags)}
            placeholder="Add vocabulary term..."
            isEditMode={isEditMode}
          />
        </CollapsibleSection>

        {/* Section 4: Previous Learning */}
        <CollapsibleSection
          id="previous"
          title="Previous Learning"
          icon={ClipboardList}
          sectionNumber={4}
          defaultOpen={false}
        >
          {(() => {
            const prevLesson = getPreviousLessonPlan(lessonPlan);
            if (prevLesson && prevLesson.learningObjectives.length > 0) {
              return (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    From Week {prevLesson.weekNumber}, Lesson {prevLesson.lessonNumber}:
                  </p>
                  <ul className="text-sm space-y-1">
                    {prevLesson.learningObjectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            return (
              <p className="text-sm text-muted-foreground italic">
                No previous lesson found for this subject.
              </p>
            );
          })()}
        </CollapsibleSection>

        {/* Section 5: Lesson Flow */}
        <div id="lesson-flow">
          <LessonFlowEditor
            lessonFlow={lessonPlan.lessonFlow}
            onChange={(flow) => updateField("lessonFlow", flow)}
            isEditMode={isEditMode}
          />
        </div>

        {/* Section 6: Resources */}
        <CollapsibleSection
          id="resources"
          title="Resources"
          icon={Package}
          sectionNumber={6}
        >
          {isEditMode ? (
            <Textarea
              value={lessonPlan.resources}
              onChange={(e) => updateField("resources", e.target.value)}
              placeholder="List resources needed: worksheets, textbook pages, materials, etc."
              className="min-h-[80px]"
            />
          ) : (
            <div 
              className="min-h-[60px] p-3 rounded-md border border-input bg-background text-sm whitespace-pre-wrap cursor-pointer"
              onClick={shakeEditButton}
            >
              {lessonPlan.resources || <span className="italic text-muted-foreground">No resources listed</span>}
            </div>
          )}
          {isEditMode && (
            <div className="text-xs text-muted-foreground mt-2">
              Attachments feature coming soon
            </div>
          )}
        </CollapsibleSection>

        {/* Section 7: Homework */}
        <CollapsibleSection
          id="homework"
          title="Homework"
          icon={HomeIcon}
          sectionNumber={7}
          headerAction={
            isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateField("homework", "None")}
                className="h-7 text-xs"
              >
                Set as None
              </Button>
            )
          }
        >
          {isEditMode ? (
            <Textarea
              value={lessonPlan.homework}
              onChange={(e) => updateField("homework", e.target.value)}
              placeholder="Describe homework assignment..."
              className="min-h-[60px]"
            />
          ) : (
            <div 
              className="min-h-[40px] p-3 rounded-md border border-input bg-background text-sm whitespace-pre-wrap cursor-pointer"
              onClick={shakeEditButton}
            >
              {lessonPlan.homework || <span className="italic text-muted-foreground">No homework assigned</span>}
            </div>
          )}
        </CollapsibleSection>

        {/* Section 8: Reflection */}
        <div id="reflection">
          <ReflectionSection
            reflection={lessonPlan.reflection}
            onChange={(reflection) => updateField("reflection", reflection)}
            onSave={() => {
              updateField("updatedAt", new Date().toISOString());
              handleSave();
            }}
            lastEditedDate={lessonPlan.updatedAt}
          />
        </div>

        {/* Section 9: Attendance Summary */}
        <CollapsibleSection
          id="attendance"
          title="Attendance"
          icon={Users}
          sectionNumber={9}
          defaultOpen={false}
        >
          {lessonPlan.attendance ? (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <div className="text-lg font-bold text-emerald-600">{lessonPlan.attendance.present}</div>
                <div className="text-[10px] text-muted-foreground">Present</div>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <div className="text-lg font-bold text-destructive">{lessonPlan.attendance.absent}</div>
                <div className="text-[10px] text-muted-foreground">Absent</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <div className="text-lg font-bold text-amber-600">{lessonPlan.attendance.late}</div>
                <div className="text-[10px] text-muted-foreground">Late</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <div className="text-lg font-bold text-blue-600">{lessonPlan.attendance.excused}</div>
                <div className="text-[10px] text-muted-foreground">Excused</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Attendance not yet recorded for this lesson.
            </div>
          )}
        </CollapsibleSection>

        {/* Bottom Padding */}
        <div className="h-20" />
      </div>
    </div>
  );

  // Focus mode renders without the layout
  if (isFocusMode) {
    return (
      <div className="min-h-screen bg-background">
        {headerContent}
        {mainContent}

        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 z-50 h-10 w-10 rounded-full bg-muted shadow-lg flex items-center justify-center hover:bg-muted/80 transition-colors border border-border"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
        )}

        {/* Floating Reflection Button */}
        <button
          onClick={() => scrollToSection("reflection")}
          className="fixed bottom-24 left-4 z-50 h-12 w-12 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center hover:bg-amber-600 transition-colors"
          aria-label="Jump to Reflection"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <TeacherAppLayout>
      {headerContent}
      {mainContent}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-50 h-10 w-10 rounded-full bg-muted shadow-lg flex items-center justify-center hover:bg-muted/80 transition-colors border border-border"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}

      {/* Floating Reflection Button */}
      <button
        onClick={() => scrollToSection("reflection")}
        className="fixed bottom-24 left-4 z-50 h-12 w-12 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center hover:bg-amber-600 transition-colors"
        aria-label="Jump to Reflection"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    </TeacherAppLayout>
  );
};

export default LessonPlanDetailPage;
