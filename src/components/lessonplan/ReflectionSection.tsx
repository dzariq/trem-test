import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, MessageSquare, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonPlanReflection } from "@/data/lessonPlanData";

interface ReflectionSectionProps {
  reflection: LessonPlanReflection;
  onChange: (reflection: LessonPlanReflection) => void;
}

const reflectionQuestions = [
  { 
    key: "objectivesRealistic", 
    label: "Were the lesson objectives achievable within the time?",
    placeholder: "What made them achievable / not achievable?"
  },
  { 
    key: "learnersLearned", 
    label: "What did learners achieve today?",
    placeholder: "State what most students can do now + any key misconceptions."
  },
  { 
    key: "learningAtmosphere", 
    label: "How was the learning atmosphere?",
    placeholder: "Engagement level, participation, behaviour, energy."
  },
  { 
    key: "differentiationWorked", 
    label: "Did differentiation/support strategies work?",
    placeholder: "Who needed extra support? What helped? What didn't?"
  },
  { 
    key: "timingsAndChanges", 
    label: "Did I follow the planned timing? If not, what changed and why?",
    placeholder: "What activity took longer/shorter?"
  },
  { 
    key: "nextLessonImprovements", 
    label: "Next lesson improvements (must be specific)",
    placeholder: 'Example: "Reduce worksheet Qs from 10 to 6", "Add 2 examples before independent work", "Prepare extension task".'
  },
] as const;

export function ReflectionSection({ reflection, onChange }: ReflectionSectionProps) {
  const isIncomplete = !reflection.comments.trim() || 
    reflectionQuestions.some(q => !reflection[q.key]?.trim());
  
  return (
    <Card className={cn("bg-amber-50/50", isIncomplete && "border-amber-300")}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Reflection</CardTitle>
          </div>
          {isIncomplete && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Incomplete</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Objectives Achievement Percentage Slider */}
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">
                Learning Objectives Achievement
              </Label>
            </div>
            <div className="space-y-3">
              <Slider
                value={[reflection.objectivesAchievementPercent]}
                onValueChange={(value) => 
                  onChange({ 
                    ...reflection, 
                    objectivesAchievementPercent: value[0]
                  })
                }
                max={100}
                min={0}
                step={5}
                className={cn(
                  "[&_[role=slider]]:h-5 [&_[role=slider]]:w-5",
                  reflection.objectivesAchievementPercent >= 70 && "[&_.relative]:bg-emerald-200 [&_[role=slider]]:border-emerald-500 [&_[role=slider]]:bg-emerald-500",
                  reflection.objectivesAchievementPercent >= 40 && reflection.objectivesAchievementPercent < 70 && "[&_.relative]:bg-amber-200 [&_[role=slider]]:border-amber-500 [&_[role=slider]]:bg-amber-500",
                  reflection.objectivesAchievementPercent < 40 && "[&_.relative]:bg-red-200 [&_[role=slider]]:border-destructive [&_[role=slider]]:bg-destructive"
                )}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">0% - Not achieved</span>
                <span className={cn(
                  "text-lg font-bold",
                  reflection.objectivesAchievementPercent >= 70 && "text-emerald-600",
                  reflection.objectivesAchievementPercent >= 40 && reflection.objectivesAchievementPercent < 70 && "text-amber-600",
                  reflection.objectivesAchievementPercent < 40 && "text-destructive"
                )}>
                  {reflection.objectivesAchievementPercent}%
                </span>
                <span className="text-xs text-muted-foreground">100% - Fully achieved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reflection Questions */}
        <div className="space-y-4">
          {reflectionQuestions.map((q) => (
            <div key={q.key} className="space-y-2">
              <Label className="text-sm font-medium">
                {q.label}
                {!reflection[q.key]?.trim() && (
                  <span className="text-amber-600 ml-2 text-xs font-normal">
                    (Required)
                  </span>
                )}
              </Label>
              <Textarea
                value={reflection[q.key] || ""}
                onChange={(e) => onChange({ ...reflection, [q.key]: e.target.value })}
                placeholder={q.placeholder}
                className={cn(
                  "min-h-[60px]",
                  !reflection[q.key]?.trim() && "border-amber-300 focus-visible:ring-amber-500"
                )}
              />
            </div>
          ))}
        </div>

        {/* Additional Comments */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Additional notes / follow-up needed
            {!reflection.comments.trim() && (
              <span className="text-amber-600 ml-2 text-xs font-normal">
                (Required)
              </span>
            )}
          </Label>
          <Textarea
            value={reflection.comments}
            onChange={(e) => onChange({ ...reflection, comments: e.target.value })}
            placeholder="Resources to improve, students to follow up, support needed."
            className={cn(
              "min-h-[80px]",
              !reflection.comments.trim() && "border-amber-300 focus-visible:ring-amber-500"
            )}
          />
        </div>

        {/* Completion Status */}
        <div className={cn(
          "rounded-md p-3 text-xs",
          isIncomplete 
            ? "bg-amber-50 border border-amber-200 text-amber-700" 
            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
        )}>
          {isIncomplete ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Please complete all reflection questions to mark this lesson plan as complete.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Reflection complete.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
