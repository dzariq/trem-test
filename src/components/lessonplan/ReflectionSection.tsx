import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonPlanReflection } from "@/data/lessonPlanData";

interface ReflectionSectionProps {
  reflection: LessonPlanReflection;
  onChange: (reflection: LessonPlanReflection) => void;
}

export function ReflectionSection({ reflection, onChange }: ReflectionSectionProps) {
  const hasNoComments = !reflection.comments.trim();
  
  return (
    <Card className={cn(hasNoComments && "border-amber-300")}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Reflection</CardTitle>
          </div>
          {hasNoComments && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Incomplete</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Objectives Achievement Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn(
                "h-4 w-4",
                reflection.objectivesAchieved ? "text-emerald-500" : "text-muted-foreground"
              )} />
              <Label className="text-sm font-medium cursor-pointer">
                Learning objectives achieved
              </Label>
            </div>
            <Switch
              checked={reflection.objectivesAchieved}
              onCheckedChange={(checked) => 
                onChange({ 
                  ...reflection, 
                  objectivesAchieved: checked,
                  objectivesNotAchieved: checked ? false : reflection.objectivesNotAchieved
                })
              }
            />
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <XCircle className={cn(
                "h-4 w-4",
                reflection.objectivesNotAchieved ? "text-destructive" : "text-muted-foreground"
              )} />
              <Label className="text-sm font-medium cursor-pointer">
                Learning objectives not achieved
              </Label>
            </div>
            <Switch
              checked={reflection.objectivesNotAchieved}
              onCheckedChange={(checked) => 
                onChange({ 
                  ...reflection, 
                  objectivesNotAchieved: checked,
                  objectivesAchieved: checked ? false : reflection.objectivesAchieved
                })
              }
            />
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Comments / Notes
            {hasNoComments && (
              <span className="text-amber-600 ml-2 text-xs font-normal">
                (Required for completion)
              </span>
            )}
          </Label>
          <Textarea
            value={reflection.comments}
            onChange={(e) => onChange({ ...reflection, comments: e.target.value })}
            placeholder="Reflect on the lesson: What went well? What could be improved? Any observations about student understanding?"
            className={cn(
              "min-h-[100px]",
              hasNoComments && "border-amber-300 focus-visible:ring-amber-500"
            )}
          />
        </div>

        {/* Completion Status */}
        <div className={cn(
          "rounded-md p-3 text-xs",
          hasNoComments 
            ? "bg-amber-50 border border-amber-200 text-amber-700" 
            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
        )}>
          {hasNoComments ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Please add your reflection comments to mark this lesson plan as complete.</span>
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
