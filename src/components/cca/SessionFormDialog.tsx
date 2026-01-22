import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { CcaSession, CcaSessionFormData } from "@/hooks/useCcaSessions";

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: CcaSession | null;
  saving: boolean;
  onSave: (data: CcaSessionFormData) => Promise<boolean>;
}

export function SessionFormDialog({
  open,
  onOpenChange,
  session,
  saving,
  onSave,
}: SessionFormDialogProps) {
  const [formData, setFormData] = useState<CcaSessionFormData>({
    sessionDate: "",
    startTime: "",
    endTime: "",
    location: "",
    customTitle: "",
    description: "",
    requirements: "",
  });

  const isEditing = !!session;

  useEffect(() => {
    if (open) {
      if (session) {
        setFormData({
          sessionDate: session.sessionDate || "",
          startTime: session.startTime || "",
          endTime: session.endTime || "",
          location: session.location || "",
          customTitle: session.customTitle || "",
          description: session.description || "",
          requirements: session.requirements || "",
        });
      } else {
        // Reset for new session
        setFormData({
          sessionDate: "",
          startTime: "",
          endTime: "",
          location: "",
          customTitle: "",
          description: "",
          requirements: "",
        });
      }
    }
  }, [open, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sessionDate) return;

    const success = await onSave({
      ...formData,
      startTime: formData.startTime || null,
      endTime: formData.endTime || null,
      location: formData.location || null,
      customTitle: formData.customTitle || null,
      description: formData.description || null,
      requirements: formData.requirements || null,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Session" : "Create Session"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="sessionDate">Date *</Label>
            <Input
              id="sessionDate"
              type="date"
              value={formData.sessionDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sessionDate: e.target.value }))
              }
              required
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Sports Hall, Music Room"
              value={formData.location || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
            />
          </div>

          {/* Custom Title */}
          <div className="space-y-2">
            <Label htmlFor="customTitle">Custom Title (optional)</Label>
            <Input
              id="customTitle"
              placeholder="e.g., Practice Match, Performance Prep"
              value={formData.customTitle || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customTitle: e.target.value }))
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Session details..."
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements / Notes</Label>
            <Textarea
              id="requirements"
              placeholder="What students should bring or prepare..."
              value={formData.requirements || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, requirements: e.target.value }))
              }
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.sessionDate}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
