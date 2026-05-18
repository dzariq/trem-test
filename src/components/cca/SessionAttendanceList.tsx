import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Save, ClipboardList } from "lucide-react";
import { cn, formatClassDisplay } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  useCcaSessionAttendance,
  type CcaAttendanceStatus,
} from "@/hooks/useCcaSessionAttendance";

interface SessionAttendanceListProps {
  sessionId: string;
  activityId: string;
  activityKind?: string | null;
  classesInvolved?: string[] | null;
  campusCode?: string | null;
  canEdit: boolean;
}

const STATUSES: { value: CcaAttendanceStatus; label: string; short: string; tone: string }[] = [
  { value: "present", label: "Present", short: "P", tone: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "absent", label: "Absent", short: "A", tone: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300" },
  { value: "late", label: "Late", short: "L", tone: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "excused", label: "Excused", short: "E", tone: "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-300" },
];

export function SessionAttendanceList({
  sessionId,
  activityId,
  activityKind,
  classesInvolved,
  campusCode,
  canEdit,
}: SessionAttendanceListProps) {
  const {
    students,
    stateMap,
    summary,
    loading,
    saving,
    error,
    lastSavedAt,
    setStudentStatus,
    setStudentNotes,
    save,
  } = useCcaSessionAttendance({
    sessionId,
    activityId,
    activityKind,
    classesInvolved,
    campusCode,
  });

  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});

  const handleSave = async () => {
    const res = await save();
    toast({
      title: res.success ? "Attendance saved" : "Could not save",
      description: res.message,
      variant: res.success ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <span className="font-medium">Attendance</span>
        {!canEdit && (
          <Badge variant="secondary" className="text-[10px]">View only</Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading attendance…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center text-center py-6 text-muted-foreground text-sm">
          <Users className="h-5 w-5 mb-2" />
          No students linked to this session yet.
        </div>
      ) : (
        <>
          {/* Summary chips */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {STATUSES.map((s) => (
              <Badge key={s.value} variant="outline" className={cn("border", s.tone)}>
                {s.short}: {summary[s.value]}
              </Badge>
            ))}
            <Badge variant="outline">Unmarked: {summary.unmarked}</Badge>
          </div>

          <ul className="divide-y rounded-md border">
            {students.map((s) => {
              const cur = stateMap[s.id]?.status ?? null;
              const note = stateMap[s.id]?.notes ?? "";
              const showNotes = !!notesOpen[s.id] || !!note;
              return (
                <li key={s.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                      {s.class && (
                        <p className="text-xs text-muted-foreground">
                          {formatClassDisplay(s.class)}
                        </p>
                      )}
                    </div>
                    {canEdit ? (
                      <div className="flex gap-1">
                        {STATUSES.map((opt) => {
                          const active = cur === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              aria-label={opt.label}
                              onClick={() =>
                                setStudentStatus(s.id, active ? null : opt.value)
                              }
                              className={cn(
                                "h-8 w-8 rounded-md border text-xs font-semibold transition",
                                active
                                  ? opt.tone
                                  : "bg-background text-muted-foreground border-border hover:bg-muted"
                              )}
                            >
                              {opt.short}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          cur ? STATUSES.find((x) => x.value === cur)?.tone : ""
                        )}
                      >
                        {cur ? STATUSES.find((x) => x.value === cur)?.label : "Unmarked"}
                      </Badge>
                    )}
                  </div>

                  {canEdit && (
                    <div>
                      {showNotes ? (
                        <Input
                          value={note}
                          onChange={(e) => setStudentNotes(s.id, e.target.value)}
                          placeholder="Add a note (optional)"
                          className="h-8 text-xs"
                        />
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setNotesOpen((p) => ({ ...p, [s.id]: true }))}
                        >
                          + Add note
                        </button>
                      )}
                    </div>
                  )}

                  {!canEdit && note && (
                    <p className="text-xs text-muted-foreground italic">"{note}"</p>
                  )}
                </li>
              );
            })}
          </ul>

          {canEdit && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground">
                {lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Not saved yet"}
              </span>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save attendance
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}