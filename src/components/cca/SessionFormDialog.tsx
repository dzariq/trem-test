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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { CcaSession, CcaSessionFormData } from "@/hooks/useCcaSessions";
import { useSchoolLocations } from "@/hooks/useSchoolLocations";

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: CcaSession | null;
  saving: boolean;
  onSave: (data: CcaSessionFormData) => Promise<boolean>;
  allowFreeText?: boolean;
  /** Parent activity name; used to suppress redundant custom titles. */
  activityName?: string;
  /**
   * Layout mode. "event" hides Custom Title + Requirements and uses
   * event-flavoured copy. Defaults to the existing session UI.
   */
  mode?: "session" | "event";
}

export function SessionFormDialog({
  open,
  onOpenChange,
  session,
  saving,
  onSave,
  allowFreeText = false,
  activityName,
  mode = "session",
}: SessionFormDialogProps) {
  const { locations, loading: locationsLoading } = useSchoolLocations();
  
  const [formData, setFormData] = useState({
    sessionDate: "",
    startTime: "",
    endTime: "",
    locationId: "",
    locationFreeText: "",
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
          locationId: session.locationId || "",
          locationFreeText: session.locationId ? "" : (session.location || ""),
          customTitle: session.customTitle || "",
          description: session.description || "",
          requirements: session.requirements || "",
        });
      } else {
        setFormData({
          sessionDate: "",
          startTime: "",
          endTime: "",
          locationId: "",
          locationFreeText: "",
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

    // Determine location values
    const selectedLocation = locations.find(l => l.id === formData.locationId);
    const locationId = formData.locationId || null;
    const locationText = selectedLocation 
      ? selectedLocation.name 
      : (allowFreeText ? formData.locationFreeText : null);

    // Drop the custom title when it just repeats the activity name.
    const cleanedTitle = (() => {
      const t = formData.customTitle?.trim();
      if (!t) return null;
      if (activityName && t.toLowerCase() === activityName.trim().toLowerCase()) {
        return null;
      }
      return t;
    })();

    const success = await onSave({
      sessionDate: formData.sessionDate,
      startTime: formData.startTime || null,
      endTime: formData.endTime || null,
      locationId,
      location: locationText || null,
      customTitle: mode === "event" ? null : cleanedTitle,
      description: formData.description || null,
      requirements: mode === "event" ? null : formData.requirements || null,
      ...(mode === "event" ? { sessionType: "event" } : {}),
    });

    if (success) {
      onOpenChange(false);
    }
  };

  const formatLocationLabel = (loc: { name: string; building: string | null }) => {
    if (loc.building) {
      return `${loc.name} (${loc.building})`;
    }
    return loc.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "event"
              ? isEditing
                ? "Edit Event Date"
                : "Set Event Date"
              : isEditing
                ? "Edit Session"
                : "Create Session"}
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

          {/* Location Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={formData.locationId}
              onValueChange={(value) =>
                setFormData((prev) => ({ 
                  ...prev, 
                  locationId: value,
                  locationFreeText: "" // Clear free text when selecting from dropdown
                }))
              }
              disabled={locationsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={locationsLoading ? "Loading..." : "Select a location"} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {formatLocationLabel(loc)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Free text fallback when allowed */}
            {allowFreeText && (
              <div className="mt-2">
                <Label htmlFor="locationFreeText" className="text-xs text-muted-foreground">
                  Or enter custom location
                </Label>
                <Input
                  id="locationFreeText"
                  placeholder="e.g., External venue"
                  value={formData.locationFreeText}
                  onChange={(e) =>
                    setFormData((prev) => ({ 
                      ...prev, 
                      locationFreeText: e.target.value,
                      locationId: "" // Clear dropdown when typing free text
                    }))
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Custom Title (hidden in event mode) */}
          {mode !== "event" && (
          <div className="space-y-2">
            <Label htmlFor="customTitle">Custom Title (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Leave empty for regular sessions. Use only when this session has a
              different name from the activity (e.g. "Watercolour Week",
              "Term 1 Showcase").
            </p>
            <Input
              id="customTitle"
              placeholder="e.g., Practice Match, Performance Prep"
              value={formData.customTitle || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customTitle: e.target.value }))
              }
            />
          </div>
          )}

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

          {/* Requirements (hidden in event mode) */}
          {mode !== "event" && (
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
          )}

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
              {mode === "event"
                ? isEditing
                  ? "Save Date"
                  : "Set Date"
                : isEditing
                  ? "Save Changes"
                  : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
