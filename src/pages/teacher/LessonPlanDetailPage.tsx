import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  ArrowLeft, 
  Save, 
  FileDown, 
  CalendarIcon,
  FileText,
  Pencil,
  Eye,
  Maximize2,
  Minimize2,
  ChevronUp,
  Package,
  Home as HomeIcon,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { LessonFlowEditor } from "@/components/lessonplan/LessonFlowEditor";
import { ObjectivesEditor } from "@/components/lessonplan/ObjectivesEditor";
import { CollapsibleSection } from "@/components/lessonplan/CollapsibleSection";
import { SectionNavigation } from "@/components/lessonplan/SectionNavigation";
import { type LessonPlan } from "@/data/lessonPlanData";
import { normalizeLessonFlow } from "@/lib/lessonplan/normalizeLessonFlow";
import { supabase } from "@/lib/supabase";
import { useLessonPlanDetail } from "@/hooks/useLessonPlans";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const sections = [
  { id: "basic-info", title: "Basic Information", shortTitle: "Basic" },
  { id: "objectives", title: "Learning Objectives", shortTitle: "Objectives" },
  { id: "lesson-flow", title: "Lesson Flow", shortTitle: "Flow" },
  { id: "resources", title: "Resources", shortTitle: "Resources" },
  { id: "homework", title: "Homework", shortTitle: "HW" },
  { id: "reflection", title: "Reflection", shortTitle: "Reflect" },
];

const LessonPlanDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef<HTMLDivElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const isNew = id === "new";

  const { lessonPlan, loading, error, updateLessonPlan } = useLessonPlanDetail(
    isNew ? undefined : id
  );
  const [draftPlan, setDraftPlan] = useState<LessonPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("basic-info");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
  const [weekSubtopics, setWeekSubtopics] = useState<Array<{ id: string; name: string }>>([]);

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
      toast.error("Create a lesson from the week list.");
      navigate("/teacher/lesson-plans");
    }
  }, [isNew, navigate]);

  useEffect(() => {
    if (lessonPlan) {
      setDraftPlan(lessonPlan);
    }
  }, [lessonPlan]);

  useEffect(() => {
    if (!id || isNew) return;
    const fetchWeekSubtopics = async () => {
      const { data: detail, error } = await supabase
        .from("lesson_plan_details")
        .select("week_id")
        .eq("id", id)
        .single();
      if (error) {
        return;
      }
      const weekId = detail?.week_id;
      if (!weekId) return;
      const { data, error: subtopicError } = await supabase
        .from("lesson_week_subtopics")
        .select("id, name")
        .eq("week_id", weekId)
        .order("sort_order", { ascending: true });
      if (subtopicError) {
        return;
      }
      setWeekSubtopics(data || []);
    };

    fetchWeekSubtopics();
  }, [id, isNew]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load lesson plan");
    }
  }, [error]);

  const updateField = <K extends keyof LessonPlan>(field: K, value: LessonPlan[K]) => {
    if (!draftPlan) return;
    const normalizedValue =
      field === "lessonFlow" ? normalizeLessonFlow(value as unknown) : value;
    setDraftPlan({ ...draftPlan, [field]: normalizedValue, updatedAt: new Date().toISOString() });
  };

  const scheduleSave = (key: string, updates: Partial<LessonPlan>) => {
    if (saveTimers.current[key]) {
      clearTimeout(saveTimers.current[key] as ReturnType<typeof setTimeout>);
    }
    saveTimers.current[key] = setTimeout(() => {
      updateLessonPlan(updates);
      saveTimers.current[key] = null;
    }, 400);
  };

  const handleSave = async () => {
    if (!draftPlan) return;

    setIsSaving(true);
    const success = await updateLessonPlan({
      title: draftPlan.title,
      date: draftPlan.date,
      subtopics: draftPlan.subtopics,
      learningObjectives: draftPlan.learningObjectives,
      lessonFlow: draftPlan.lessonFlow,
      resources: draftPlan.resources,
      attachments: draftPlan.attachments,
      homework: draftPlan.homework,
      reflection: draftPlan.reflection,
      attendance: draftPlan.attendance,
      approval: draftPlan.approval,
    });

    if (success) {
      toast.success("Lesson plan saved successfully");
      setIsEditMode(false);
    }
    setIsSaving(false);
  };

  const handleSaveReflection = async () => {
    if (!draftPlan) return;
    const now = new Date().toISOString();
    const reflectionData = draftPlan.reflection as unknown as Record<string, unknown> | null;
    const notes = reflectionData?.notes?.toString() ?? "";
    const completion = notes.trim() ? "complete" : "incomplete";
    const approvalData = draftPlan.approval as unknown as Record<string, unknown> | null;
    const nextApproval = {
      ...(approvalData || {}),
      completion,
      completed_at: completion === "complete" ? now : null,
    };

    updateField("approval", nextApproval as unknown as LessonPlan["approval"]);

    const success = await updateLessonPlan({
      reflection: draftPlan.reflection,
      approval: nextApproval as unknown as LessonPlan["approval"],
    });

    if (success) {
      toast.success("Reflection saved");
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current || !draftPlan) return;
    
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
      pdf.save(`lesson-plan-${draftPlan.title || "untitled"}.pdf`);
      
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
    }
    setIsExporting(false);
  };

  if (loading) {
    return (
      <TeacherAppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </TeacherAppLayout>
    );
  }
  if (!draftPlan) {
    return (
      <TeacherAppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Unable to load lesson plan.</p>
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
                {draftPlan.title || "Untitled"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Week {draftPlan.weekNumber} • LP {draftPlan.lessonNumber}
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
        >
          <div className="space-y-4">
            {/* Lesson Title */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lesson Title</Label>
              {isEditMode ? (
                <Input
                  value={draftPlan.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Enter lesson title..."
                  className="h-10"
                />
              ) : (
                <div
                  className="h-10 px-3 flex items-center rounded-md border border-input bg-background text-sm cursor-pointer"
                  onClick={shakeEditButton}
                >
                  {draftPlan.title || <span className="italic text-muted-foreground">No title</span>}
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
                  {draftPlan.subject || <span className="italic text-muted-foreground">No subject</span>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Topic</Label>
                <div
                  className="h-9 px-3 flex items-center rounded-md border border-input bg-background text-sm truncate cursor-pointer"
                  onClick={shakeEditButton}
                >
                  {draftPlan.topic || <span className="italic text-muted-foreground">No topic</span>}
                </div>
              </div>
            </div>

            {/* Week Subtopics */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Week Subtopics</Label>
              <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                {weekSubtopics.length > 0 ? (
                  weekSubtopics.map((subtopic) => (
                    <Badge key={subtopic.id} variant="secondary" className="text-xs">
                      {subtopic.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground italic">No subtopics</span>
                )}
              </div>
            </div>

            {/* Week, Lesson, Class */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Week</Label>
                <div
                  className="h-9 px-3 flex items-center rounded-md border border-input bg-background text-sm cursor-pointer"
                  onClick={shakeEditButton}
                >
                  W{draftPlan.weekNumber}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Lesson</Label>
                <div
                  className="h-9 px-3 flex items-center rounded-md border border-input bg-background text-sm cursor-pointer"
                  onClick={shakeEditButton}
                >
                  L{draftPlan.lessonNumber}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Class</Label>
                <div
                  className="h-9 px-3 flex items-center rounded-md border border-input bg-background text-sm cursor-pointer"
                  onClick={shakeEditButton}
                >
                  {draftPlan.className || <span className="italic text-muted-foreground">No class</span>}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 2: Learning Objectives */}
        <div id="objectives">
          <ObjectivesEditor
            objectives={draftPlan.learningObjectives}
            onChange={(objectives) => {
              updateField("learningObjectives", objectives);
              scheduleSave("learning_objectives", { learningObjectives: objectives });
            }}
            isEditMode={isEditMode}
          />
        </div>

        {/* Section 3: Lesson Flow */}
        <div id="lesson-flow">
          <LessonFlowEditor
            lessonFlow={draftPlan.lessonFlow}
            onChange={(flow) => {
              updateField("lessonFlow", flow);
              scheduleSave("lesson_flow", { lessonFlow: flow });
            }}
            isEditMode={isEditMode}
          />
        </div>

        {/* Section 4: Resources */}
        <CollapsibleSection
          id="resources"
          title="Resources"
          icon={Package}
          sectionNumber={4}
        >
          {isEditMode ? (
            <Textarea
              value={draftPlan.resources}
              onChange={(e) => updateField("resources", e.target.value)}
              onBlur={() => scheduleSave("resources", { resources: draftPlan.resources })}
              placeholder="List resources needed: worksheets, textbook pages, materials, etc."
              className="min-h-[80px]"
            />
          ) : (
            <div 
              className="min-h-[60px] p-3 rounded-md border border-input bg-background text-sm whitespace-pre-wrap cursor-pointer"
              onClick={shakeEditButton}
            >
              {draftPlan.resources || <span className="italic text-muted-foreground">No resources listed</span>}
            </div>
          )}
          {isEditMode && (
            <div className="text-xs text-muted-foreground mt-2">
              Attachments feature coming soon
            </div>
          )}
        </CollapsibleSection>

        {/* Section 5: Homework */}
        <CollapsibleSection
          id="homework"
          title="Homework"
          icon={HomeIcon}
          sectionNumber={5}
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
              value={draftPlan.homework}
              onChange={(e) => updateField("homework", e.target.value)}
              onBlur={() => scheduleSave("homework", { homework: draftPlan.homework })}
              placeholder="Describe homework assignment..."
              className="min-h-[60px]"
            />
          ) : (
            <div 
              className="min-h-[40px] p-3 rounded-md border border-input bg-background text-sm whitespace-pre-wrap cursor-pointer"
              onClick={shakeEditButton}
            >
              {draftPlan.homework || <span className="italic text-muted-foreground">No homework assigned</span>}
            </div>
          )}
        </CollapsibleSection>

        {/* Section 6: Reflection */}
        <div id="reflection">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold">Reflection</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <Textarea
                value={
                  ((draftPlan.reflection as unknown as Record<string, unknown> | null)?.notes as string) ||
                  ""
                }
                onChange={(e) => {
                  const currentReflection = draftPlan.reflection as unknown as Record<string, unknown> | null;
                  updateField("reflection", {
                    ...(currentReflection || {}),
                    notes: e.target.value,
                    updated_at: new Date().toISOString(),
                  } as unknown as LessonPlan["reflection"]);
                }}
                placeholder="Add reflection notes..."
                className="min-h-[120px]"
              />
              <Button onClick={handleSaveReflection} className="w-full h-9">
                Save Reflection
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Section 7: Lesson Date */}
        <Card className="bg-muted/30">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Lesson Date</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select the date when this lesson takes place
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !draftPlan.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {draftPlan.date ? (
                    format(parseISO(draftPlan.date), "EEEE, d MMMM yyyy")
                  ) : (
                    <span>Select lesson date...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={draftPlan.date ? parseISO(draftPlan.date) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      updateField("date", format(date, "yyyy-MM-dd"));
                    }
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>


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






