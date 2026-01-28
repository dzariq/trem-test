import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonReflection, LessonDetail } from "@/hooks/useTeacherLessonPlans";

interface TeacherLessonReflectionFormProps {
  lesson: LessonDetail;
  reflection: LessonReflection | undefined;
  onSave: (data: Partial<Omit<LessonReflection, "id" | "lessonPlanDetailId" | "classYearId" | "teacherUserId" | "createdAt" | "updatedAt">>) => Promise<boolean>;
  saving: boolean;
  disabled?: boolean;
}

export function TeacherLessonReflectionForm({
  lesson,
  reflection,
  onSave,
  saving,
  disabled = false,
}: TeacherLessonReflectionFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    whatWentWell: reflection?.whatWentWell || "",
    areasForImprovement: reflection?.areasForImprovement || "",
    studentEngagement: reflection?.studentEngagement || "",
    followUpActions: reflection?.followUpActions || "",
    learningOutcomesAchieved: reflection?.learningOutcomesAchieved || false,
    reflectionNotes: reflection?.reflectionNotes || "",
  });

  // Update form when reflection changes (e.g., class selection changes)
  useEffect(() => {
    setFormData({
      whatWentWell: reflection?.whatWentWell || "",
      areasForImprovement: reflection?.areasForImprovement || "",
      studentEngagement: reflection?.studentEngagement || "",
      followUpActions: reflection?.followUpActions || "",
      learningOutcomesAchieved: reflection?.learningOutcomesAchieved || false,
      reflectionNotes: reflection?.reflectionNotes || "",
    });
  }, [reflection]);

  const handleSave = async () => {
    const success = await onSave(formData);
    if (success && !reflection) {
      // Keep expanded after first save
    }
  };

  const hasReflection = !!reflection;
  const isFormDirty = 
    formData.whatWentWell !== (reflection?.whatWentWell || "") ||
    formData.areasForImprovement !== (reflection?.areasForImprovement || "") ||
    formData.studentEngagement !== (reflection?.studentEngagement || "") ||
    formData.followUpActions !== (reflection?.followUpActions || "") ||
    formData.learningOutcomesAchieved !== (reflection?.learningOutcomesAchieved || false) ||
    formData.reflectionNotes !== (reflection?.reflectionNotes || "");

  return (
    <Card className={cn(
      "border transition-all",
      hasReflection ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20" : "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20"
    )}>
      <CardHeader 
        className="py-3 px-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {hasReflection ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              <CardTitle className="text-sm font-medium">
                Lesson {lesson.lessonNumber}: {lesson.title || "Untitled"}
              </CardTitle>
            </div>
            <Badge 
              variant={hasReflection ? "default" : "secondary"}
              className={cn(
                "text-xs",
                hasReflection 
                  ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900" 
                  : "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
              )}
            >
              {hasReflection ? "Reflected" : "Not reflected"}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-4 pb-4 space-y-4">
          {/* Learning Outcomes Achieved */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <Label htmlFor={`outcomes-${lesson.id}`} className="text-sm font-medium cursor-pointer">
              Learning outcomes achieved?
            </Label>
            <Switch
              id={`outcomes-${lesson.id}`}
              checked={formData.learningOutcomesAchieved}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, learningOutcomesAchieved: checked }))}
              disabled={disabled}
            />
          </div>

          {/* What Went Well */}
          <div className="space-y-2">
            <Label htmlFor={`well-${lesson.id}`} className="text-sm font-medium">
              What went well?
            </Label>
            <Textarea
              id={`well-${lesson.id}`}
              value={formData.whatWentWell}
              onChange={(e) => setFormData(prev => ({ ...prev, whatWentWell: e.target.value }))}
              placeholder="Describe successful moments and why they worked..."
              className="min-h-[80px] resize-none"
              disabled={disabled}
            />
          </div>

          {/* Areas for Improvement */}
          <div className="space-y-2">
            <Label htmlFor={`improve-${lesson.id}`} className="text-sm font-medium">
              Areas for improvement
            </Label>
            <Textarea
              id={`improve-${lesson.id}`}
              value={formData.areasForImprovement}
              onChange={(e) => setFormData(prev => ({ ...prev, areasForImprovement: e.target.value }))}
              placeholder="What could be done better next time..."
              className="min-h-[80px] resize-none"
              disabled={disabled}
            />
          </div>

          {/* Student Engagement */}
          <div className="space-y-2">
            <Label htmlFor={`engagement-${lesson.id}`} className="text-sm font-medium">
              Student engagement
            </Label>
            <Textarea
              id={`engagement-${lesson.id}`}
              value={formData.studentEngagement}
              onChange={(e) => setFormData(prev => ({ ...prev, studentEngagement: e.target.value }))}
              placeholder="Describe student participation and engagement levels..."
              className="min-h-[80px] resize-none"
              disabled={disabled}
            />
          </div>

          {/* Follow-up Actions */}
          <div className="space-y-2">
            <Label htmlFor={`followup-${lesson.id}`} className="text-sm font-medium">
              Follow-up actions
            </Label>
            <Textarea
              id={`followup-${lesson.id}`}
              value={formData.followUpActions}
              onChange={(e) => setFormData(prev => ({ ...prev, followUpActions: e.target.value }))}
              placeholder="Actions to take in the next lesson..."
              className="min-h-[80px] resize-none"
              disabled={disabled}
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor={`notes-${lesson.id}`} className="text-sm font-medium">
              Additional notes
            </Label>
            <Textarea
              id={`notes-${lesson.id}`}
              value={formData.reflectionNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, reflectionNotes: e.target.value }))}
              placeholder="Any other observations or notes..."
              className="min-h-[60px] resize-none"
              disabled={disabled}
            />
          </div>

          {/* Save Button - Sticky at bottom */}
          <div className="sticky bottom-0 pt-3 bg-gradient-to-t from-card to-transparent">
            <Button
              onClick={handleSave}
              disabled={saving || disabled || !isFormDirty}
              className="w-full gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Reflection
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
