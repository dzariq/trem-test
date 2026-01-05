import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Target } from "lucide-react";

interface ObjectivesEditorProps {
  objectives: string[];
  onChange: (objectives: string[]) => void;
}

export function ObjectivesEditor({ objectives, onChange }: ObjectivesEditorProps) {
  const addObjective = () => {
    onChange([...objectives, ""]);
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    onChange(newObjectives);
  };

  const removeObjective = (index: number) => {
    onChange(objectives.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Learning Objectives</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addObjective}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {objectives.map((objective, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex items-center gap-1 pt-2">
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">•</span>
              </div>
              <Input
                value={objective}
                onChange={(e) => updateObjective(index, e.target.value)}
                placeholder={`Objective ${index + 1}...`}
                className="flex-1 h-9"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeObjective(index)}
                className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {objectives.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">No objectives added yet</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addObjective}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add First Objective
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
