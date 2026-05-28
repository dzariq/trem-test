import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatSessionTimeRange } from "@/lib/ccaSessionFormat";
import { SessionFormDialog } from "@/components/cca/SessionFormDialog";
import {
  useCcaSessions,
  type CcaSession,
  type CcaSessionFormData,
} from "@/hooks/useCcaSessions";

function formatDate(d: string) {
  try {
    return format(parseISO(d), "EEE, MMM d, yyyy");
  } catch {
    return d;
  }
}

interface EventDateRowProps {
  activityId: string;
  activityName: string;
  allowFreeText?: boolean;
  canEdit: boolean;
  sessionsHook: ReturnType<typeof useCcaSessions>;
}

/**
 * Single-date editor for event-kind CCAs. Events have exactly one date so we
 * surface it inline in Overview instead of in a Schedule list. Admins/PICs
 * can Set / Edit / Remove via the existing session CRUD flow.
 */
export function EventDateRow({
  activityId,
  activityName,
  allowFreeText,
  canEdit,
  sessionsHook,
}: EventDateRowProps) {
  const {
    sessions,
    loading,
    saving,
    createSession,
    updateSession,
    deleteSession,
  } = sessionsHook;

  const active = useMemo(
    () =>
      sessions
        .filter((s) => !s.isCancelled)
        .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate)),
    [sessions],
  );
  const primary: CcaSession | null = active[0] ?? null;
  const hasMultiple = active.length > 1;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CcaSession | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async (data: CcaSessionFormData) => {
    const payload: CcaSessionFormData = { ...data, sessionType: "event" };
    if (editing) return updateSession(editing.id, payload);
    return createSession(payload);
  };

  const timeLabel = primary
    ? formatSessionTimeRange(primary.startTime, primary.endTime)
    : null;

  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Event Date
            </h2>
          </div>
          {canEdit && primary && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setEditing(primary);
                  setFormOpen(true);
                }}
                disabled={saving}
                aria-label="Edit date"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
                aria-label="Remove date"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {loading && !primary ? (
          <Skeleton className="h-10 w-full" />
        ) : primary ? (
          <div className="space-y-1.5">
            <p className="text-base font-semibold text-foreground">
              {formatDate(primary.sessionDate)}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {timeLabel && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeLabel}
                </span>
              )}
              {primary.locationName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {primary.locationName}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              No date set yet.
            </p>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                disabled={saving}
              >
                <Plus className="h-4 w-4 mr-1" /> Set date
              </Button>
            )}
          </div>
        )}

        {hasMultiple && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Multiple dates found for this event. Only the earliest is shown —
              please clean up extras.
            </span>
          </div>
        )}
      </CardContent>

      <SessionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        session={editing}
        saving={saving}
        onSave={handleSave}
        allowFreeText={allowFreeText}
        activityName={activityName}
        mode="event"
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove event date?</AlertDialogTitle>
            <AlertDialogDescription>
              This event will have no scheduled date until you set a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (primary) await deleteSession(primary.id);
                setConfirmDelete(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading && primary && (
        <div className="px-4 pb-3 text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Refreshing…
        </div>
      )}
    </Card>
  );
}