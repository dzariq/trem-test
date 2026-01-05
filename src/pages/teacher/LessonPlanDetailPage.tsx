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
  ClipboardList
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
  type LessonPlan 
} from "@/data/lessonPlanData";
import { allSubjects } from "@/data/subjectsConfig";
import { teacherProfile } from "@/data/teacherMockData";
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
        teacherProfile.name,
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
                  <Label className="text-xs text-muted-foreground">Week Number</Label>
                  <Input
                    type="number"
                    value={lessonPlan.weekNumber}
                    onChange={(e) => updateField("weekNumber", parseInt(e.target.value) || 1)}
                    min={1}
                    max={52}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Lesson Number</Label>
                  <Select 
                    value={lessonPlan.lessonNumber.toString()} 
                    onValueChange={(v) => updateField("lessonNumber", parseInt(v))}
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
                  <Label className="text-xs text-muted-foreground">Teacher Name</Label>
                  <Input
                    value={lessonPlan.teacherName}
                    onChange={(e) => updateField("teacherName", e.target.value)}
                    className="h-9"
                    readOnly
                  />
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

              {/* Subject */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Select 
                  value={lessonPlan.subject} 
                  onValueChange={(v) => updateField("subject", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic & Subtopic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Topic</Label>
                  <Input
                    value={lessonPlan.topic}
                    onChange={(e) => updateField("topic", e.target.value)}
                    placeholder="Main topic..."
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Subtopic</Label>
                  <Input
                    value={lessonPlan.subtopic}
                    onChange={(e) => updateField("subtopic", e.target.value)}
                    placeholder="Subtopic..."
                    className="h-9"
                  />
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
              <Textarea
                value={lessonPlan.previousLearning}
                onChange={(e) => updateField("previousLearning", e.target.value)}
                placeholder="Describe what students have previously learned that relates to this lesson..."
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Tip: You can reference objectives from the previous lesson plan.
              </p>
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
