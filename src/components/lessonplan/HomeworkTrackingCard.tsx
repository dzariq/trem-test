import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentInfo, LessonWithHomework } from "@/hooks/useHomeworkTracking";

interface HomeworkTrackingCardProps {
  lessonWithHomework: LessonWithHomework;
  students: StudentInfo[];
  saving: boolean;
  onToggleSubmission: (studentId: string, currentStatus: boolean) => Promise<boolean>;
  getSubmissionStatus: (studentId: string) => boolean;
  submissionCount: { submitted: number; total: number };
}

export function HomeworkTrackingCard({
  lessonWithHomework,
  students,
  saving,
  onToggleSubmission,
  getSubmissionStatus,
  submissionCount,
}: HomeworkTrackingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { lesson, topicTitle, weekNumber, weekTitle } = lessonWithHomework;

  const progressPercentage =
    submissionCount.total > 0
      ? Math.round((submissionCount.submitted / submissionCount.total) * 100)
      : 0;

  return (
    <Card
      className={cn(
        "border transition-all overflow-hidden",
        "border-sky-200 dark:border-sky-800 bg-card"
      )}
    >
      <CardHeader
        className="py-3 px-4 cursor-pointer hover:bg-sky-50/50 dark:hover:bg-sky-950/30"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="space-y-2">
          {/* Lesson Info */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium truncate">
                L{lesson.lessonNumber}: {lesson.title || "Untitled"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Week {weekNumber}: {weekTitle}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Submission Progress</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  progressPercentage === 100
                    ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                    : "bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300"
                )}
              >
                {submissionCount.submitted}/{submissionCount.total}
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="px-4 pb-4 space-y-4">
          {/* Homework Preview */}
          <div className="bg-sky-50/50 dark:bg-sky-950/30 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-300">
              <BookOpen className="h-3 w-3" />
              Homework Assignment
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {lesson.homework}
            </p>
          </div>

          {/* Student List */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <User className="h-3 w-3" />
              Student Submissions
            </div>
            <div className="divide-y divide-border rounded-lg border">
              {students.map((student) => {
                const isSubmitted = getSubmissionStatus(student.id);
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm truncate">{student.name}</span>
                      {student.studentId && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({student.studentId})
                        </span>
                      )}
                    </div>
                    <Checkbox
                      checked={isSubmitted}
                      onCheckedChange={() => onToggleSubmission(student.id, isSubmitted)}
                      disabled={saving}
                      className={cn(
                        "shrink-0",
                        isSubmitted && "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
