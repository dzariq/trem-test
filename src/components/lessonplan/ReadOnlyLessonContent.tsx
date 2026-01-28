import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, Target, Workflow, Package, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeLessonFlow } from "@/lib/lessonplan/normalizeLessonFlow";
import type { LessonDetail } from "@/hooks/useTeacherLessonPlans";

interface ReadOnlyLessonContentProps {
  lesson: LessonDetail;
}

export function ReadOnlyLessonContent({ lesson }: ReadOnlyLessonContentProps) {
  const lessonFlow = normalizeLessonFlow(lesson.lessonFlow);

  const renderFlowSection = (section: typeof lessonFlow.beginning, title: string, bgColor: string) => {
    if (!section || section.steps.length === 0) return null;

    return (
      <div className={cn("rounded-lg p-3", bgColor)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</span>
          {section.duration > 0 && (
            <Badge variant="outline" className="text-xs">{section.duration} min</Badge>
          )}
        </div>
        {section.description && (
          <p className="text-sm text-foreground mb-2">{section.description}</p>
        )}
        {section.steps.length > 0 && (
          <ul className="space-y-1">
            {section.steps.map((step, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-muted-foreground/50">•</span>
                <span>{typeof step === "string" ? step : step.title || step.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Lesson Title</Label>
            <p className="text-sm font-medium">{lesson.title || "Untitled"}</p>
          </div>
          
          {lesson.date && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <p className="text-sm">{lesson.date}</p>
            </div>
          )}

          {lesson.subtopics.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Subtopics</Label>
              <div className="flex flex-wrap gap-1">
                {lesson.subtopics.map((subtopic, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{subtopic}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      {lesson.learningObjectives.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Learning Objectives</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ul className="space-y-2">
              {lesson.learningObjectives.map((objective, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-primary font-medium">{idx + 1}.</span>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Lesson Flow */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Lesson Flow</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {renderFlowSection(lessonFlow.beginning, "Beginning", "bg-sky-50")}
          {renderFlowSection(lessonFlow.middle, "Middle", "bg-amber-50")}
          {renderFlowSection(lessonFlow.end, "End", "bg-emerald-50")}
          
          {!lessonFlow.beginning.steps.length && !lessonFlow.middle.steps.length && !lessonFlow.end.steps.length && (
            <p className="text-sm text-muted-foreground italic">No lesson flow defined</p>
          )}
        </CardContent>
      </Card>

      {/* Resources */}
      {lesson.resources && (
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Resources</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm whitespace-pre-wrap">{lesson.resources}</p>
          </CardContent>
        </Card>
      )}

      {/* Homework */}
      {lesson.homework && (
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Homework</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm whitespace-pre-wrap">{lesson.homework}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
