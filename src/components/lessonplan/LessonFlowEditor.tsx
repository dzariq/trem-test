import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { LessonFlow, LessonFlowActivity } from "@/data/lessonPlanData";

interface LessonFlowEditorProps {
  lessonFlow: LessonFlow;
  onChange: (flow: LessonFlow) => void;
  isEditMode?: boolean;
}

export function LessonFlowEditor({ lessonFlow, onChange, isEditMode = true }: LessonFlowEditorProps) {
  const [activeTab, setActiveTab] = useState<"beginning" | "middle" | "end">("beginning");

  const updateSection = (
    section: "beginning" | "middle" | "end",
    updates: Partial<LessonFlowActivity>
  ) => {
    onChange({
      ...lessonFlow,
      [section]: {
        ...lessonFlow[section],
        ...updates
      }
    });
  };

  const addStep = (section: "beginning" | "middle" | "end") => {
    const currentSteps = lessonFlow[section].steps;
    updateSection(section, { steps: [...currentSteps, ""] });
  };

  const updateStep = (section: "beginning" | "middle" | "end", index: number, value: string) => {
    const newSteps = [...lessonFlow[section].steps];
    newSteps[index] = value;
    updateSection(section, { steps: newSteps });
  };

  const removeStep = (section: "beginning" | "middle" | "end", index: number) => {
    const newSteps = lessonFlow[section].steps.filter((_, i) => i !== index);
    updateSection(section, { steps: newSteps });
  };

  const renderSectionEditor = (section: "beginning" | "middle" | "end", title: string, colorClass: string) => {
    const activity = lessonFlow[section];
    
    return (
      <div className="space-y-4">
        {/* Duration */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium w-20">Duration</Label>
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <Input
                type="number"
                value={activity.duration}
                onChange={(e) => updateSection(section, { duration: parseInt(e.target.value) || 0 })}
                className="w-20 h-9"
                min={1}
                max={120}
              />
            ) : (
              <span className="text-sm font-medium">{activity.duration}</span>
            )}
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Activity Description</Label>
          {isEditMode ? (
            <Textarea
              value={activity.description}
              onChange={(e) => updateSection(section, { description: e.target.value })}
              placeholder="Describe the main activity for this section..."
              className="min-h-[80px]"
            />
          ) : (
            <div className="min-h-[60px] p-3 rounded-md border border-input bg-muted/50 text-sm">
              {activity.description || <span className="italic text-muted-foreground">No description</span>}
            </div>
          )}
        </div>
        
        {/* Steps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Steps</Label>
            {isEditMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addStep(section)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Step
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {activity.steps.map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex items-center gap-1 pt-2">
                  {isEditMode && <GripVertical className="h-4 w-4 text-muted-foreground/50" />}
                  <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                </div>
                {isEditMode ? (
                  <>
                    <Input
                      value={step}
                      onChange={(e) => updateStep(section, index, e.target.value)}
                      placeholder={`Step ${index + 1}...`}
                      className="flex-1 h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(section, index)}
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <span className="text-sm py-2">{step || <span className="italic text-muted-foreground">Empty step</span>}</span>
                )}
              </div>
            ))}
            
            {activity.steps.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-2">
                {isEditMode ? 'No steps added yet. Click "Add Step" to begin.' : 'No steps added.'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-semibold">Planned Lesson Flow</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
            <TabsTrigger value="beginning" className="text-xs flex-col py-2 px-1 gap-0.5">
              <span>Beginning</span>
              <span className="text-muted-foreground text-[10px]">({lessonFlow.beginning.duration}m)</span>
            </TabsTrigger>
            <TabsTrigger value="middle" className="text-xs flex-col py-2 px-1 gap-0.5">
              <span>Middle</span>
              <span className="text-muted-foreground text-[10px]">({lessonFlow.middle.duration}m)</span>
            </TabsTrigger>
            <TabsTrigger value="end" className="text-xs flex-col py-2 px-1 gap-0.5">
              <span>End</span>
              <span className="text-muted-foreground text-[10px]">({lessonFlow.end.duration}m)</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="beginning" className="mt-0">
            {renderSectionEditor("beginning", "Beginning", "border-l-emerald-500")}
          </TabsContent>
          <TabsContent value="middle" className="mt-0">
            {renderSectionEditor("middle", "Middle", "border-l-blue-500")}
          </TabsContent>
          <TabsContent value="end" className="mt-0">
            {renderSectionEditor("end", "End", "border-l-amber-500")}
          </TabsContent>
        </Tabs>

        {/* Total Duration Summary */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Duration:</span>
          <span className="font-medium">
            {lessonFlow.beginning.duration + lessonFlow.middle.duration + lessonFlow.end.duration} minutes
          </span>
        </div>
      </CardContent>
    </Card>
  );
}