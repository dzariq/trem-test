import { useState, useEffect, useRef } from "react";
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
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TagInput } from "@/components/lessonplan/TagInput";
import { LessonFlowEditor } from "@/components/lessonplan/LessonFlowEditor";
import { ObjectivesEditor } from "@/components/lessonplan/ObjectivesEditor";
import { ApprovalSection } from "@/components/lessonplan/ApprovalSection";
import { ReflectionSection } from "@/components/lessonplan/ReflectionSection";
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

const LessonPlanDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);
  
  const isNew = id === "new";
  const weekParam = searchParams.get("week");
  const lessonParam = searchParams.get("lesson");

  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    } else if (id) {
      const existingLP = getLessonPlanById(id);
      if (existingLP) {
        setLessonPlan(existingLP);
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
    // Simulate save
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

  return (
    <TeacherAppLayout>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/teacher/lesson-plans")}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
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
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="h-8 gap-1"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 gap-1"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <ScrollArea className="h-[calc(100vh-140px)]">
        <div ref={printRef} className="p-4 space-y-4 bg-background">
          {/* Section 1: Basic Information */}
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              {/* Subject (Read-only) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/50 text-sm text-muted-foreground">
                  {lessonPlan.subject || <span className="italic">No subject assigned</span>}
                </div>
              </div>

              {/* Topic (Read-only) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Topic</Label>
                <div className="h-9 px-3 flex items-center rounded-md border border-input bg-muted/50 text-sm text-muted-foreground">
                  {lessonPlan.topic || <span className="italic">No topic assigned</span>}
                </div>
              </div>

              {/* Subtopics (Multi-select) */}
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
                      {/* Select All / Deselect All */}
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
                      {/* Subtopic options */}
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
                          <p className="text-xs text-muted-foreground p-2">No subtopics available for this topic.</p>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Lesson Title */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Lesson Title</Label>
                <Input
                  value={lessonPlan.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Enter lesson title..."
                  className="h-10"
                />
              </div>

              {/* Week & Lesson Number */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Week Number</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => navigate("/teacher/week-config")}
                    >
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
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
                            Week {week.weekNumber} ({formatWeekDateRange(week.weekNumber)})
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Lesson Number</Label>
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
                          Lesson {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Teacher & Class */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Teacher(s)</Label>
                  <div className="flex flex-wrap gap-1.5 min-h-9 items-center">
                    {lessonPlan.teacherNames.map((name, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Class</Label>
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
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={lessonPlan.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Learning Objectives */}
          <ObjectivesEditor
            objectives={lessonPlan.learningObjectives}
            onChange={(objectives) => updateField("learningObjectives", objectives)}
          />

          {/* Section 3: Vocabulary / Terminology */}
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Formula / Vocabulary / Terminology</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <TagInput
                tags={lessonPlan.vocabulary}
                onChange={(tags) => updateField("vocabulary", tags)}
                placeholder="Add vocabulary term..."
              />
            </CardContent>
          </Card>

          {/* Section 4: Previous Learning */}
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Previous Learning</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {(() => {
                const prevLesson = getPreviousLessonPlan(lessonPlan);
                if (prevLesson && prevLesson.learningObjectives.length > 0) {
                  return (
                    <div className="bg-muted/50 rounded-lg p-3 border">
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
            </CardContent>
          </Card>

          {/* Section 5: Lesson Flow */}
          <LessonFlowEditor
            lessonFlow={lessonPlan.lessonFlow}
            onChange={(flow) => updateField("lessonFlow", flow)}
          />

          {/* Section 6: Resources */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold">Resources</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <Textarea
                value={lessonPlan.resources}
                onChange={(e) => updateField("resources", e.target.value)}
                placeholder="List resources needed: worksheets, textbook pages, materials, etc."
                className="min-h-[80px]"
              />
              <div className="text-xs text-muted-foreground">
                Attachments feature coming soon
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Homework */}
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Homework</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateField("homework", "None")}
                  className="h-7 text-xs"
                >
                  Set as None
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Textarea
                value={lessonPlan.homework}
                onChange={(e) => updateField("homework", e.target.value)}
                placeholder="Describe homework assignment..."
                className="min-h-[60px]"
              />
            </CardContent>
          </Card>

          {/* Section 8: Reflection */}
          <ReflectionSection
            reflection={lessonPlan.reflection}
            onChange={(reflection) => updateField("reflection", reflection)}
          />

          {/* Section 9: Attendance Summary */}
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Attendance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {lessonPlan.attendance ? (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <div className="text-lg font-bold text-emerald-600">{lessonPlan.attendance.present}</div>
                    <div className="text-[10px] text-muted-foreground">Present</div>
                  </div>
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <div className="text-lg font-bold text-destructive">{lessonPlan.attendance.absent}</div>
                    <div className="text-[10px] text-muted-foreground">Absent</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50">
                    <div className="text-lg font-bold text-amber-600">{lessonPlan.attendance.late}</div>
                    <div className="text-[10px] text-muted-foreground">Late</div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50">
                    <div className="text-lg font-bold text-blue-600">{lessonPlan.attendance.excused}</div>
                    <div className="text-[10px] text-muted-foreground">Excused</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Attendance not yet recorded for this lesson.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 10: Approval */}
          <ApprovalSection
            approval={lessonPlan.approval}
            onChange={(approval) => updateField("approval", approval)}
          />

          {/* Bottom Padding for Navigation */}
          <div className="h-4" />
        </div>
      </ScrollArea>
    </TeacherAppLayout>
  );
};

export default LessonPlanDetailPage;
