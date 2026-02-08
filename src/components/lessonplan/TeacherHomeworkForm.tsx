import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, ClipboardCopy, Save, Loader2, ChevronDown, ChevronUp, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonDetail } from "@/hooks/useTeacherLessonPlans";

interface TeacherHomeworkFormProps {
  lesson: LessonDetail;
  onSave: (homework: string) => Promise<boolean>;
  saving: boolean;
}

export function TeacherHomeworkForm({
  lesson,
  onSave,
  saving,
}: TeacherHomeworkFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [homework, setHomework] = useState(lesson.homework || "");

  // Update form when lesson changes
  useEffect(() => {
    setHomework(lesson.homework || "");
  }, [lesson.homework]);

  const handleSave = async () => {
    await onSave(homework);
  };

  const hasHomework = !!lesson.homework && lesson.homework.trim().length > 0;
  const isFormDirty = homework !== (lesson.homework || "");

  return (
    <Card className={cn(
      "border transition-all",
      hasHomework 
        ? "border-sky-200 dark:border-sky-800 bg-sky-50/30 dark:bg-sky-950/20" 
        : "border-muted bg-card"
    )}>
      <CardHeader 
        className="py-3 px-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {hasHomework ? (
                <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <CardTitle className="text-sm font-medium">
                Lesson {lesson.lessonNumber}: {lesson.title || "Untitled"}
              </CardTitle>
            </div>
            <Badge 
              variant={hasHomework ? "default" : "secondary"}
              className={cn(
                "text-xs",
                hasHomework 
                  ? "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900" 
                  : ""
              )}
            >
              {hasHomework ? "Assigned" : "No homework"}
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
          {/* Homework Assignment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`homework-${lesson.id}`} className="text-sm font-medium flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                Homework Assignment
              </Label>
              {lesson.homework && lesson.homework.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHomework(lesson.homework || "")}
                  disabled={homework === lesson.homework}
                  className="h-7 text-xs gap-1.5 border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950"
                >
                  <ClipboardCopy className="h-3 w-3" />
                  Insert from Lesson Plan
                </Button>
              )}
            </div>
            <Textarea
              id={`homework-${lesson.id}`}
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="Enter homework assignment for this lesson..."
              className="min-h-[120px] resize-none border-sky-200/50 dark:border-sky-800/50 focus:border-sky-400 dark:focus:border-sky-600"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={saving || !isFormDirty}
              className="w-full gap-2 bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Homework
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
