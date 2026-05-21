import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Save, ClipboardList, Check, X, Filter } from "lucide-react";
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

const STATUSES: {
  value: CcaAttendanceStatus;
  label: string;
  short: string;
  tone: string;
  Icon: typeof Check;
}[] = [
  {
    value: "present",
    label: "Present",
    short: "P",
    tone: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300",
    Icon: Check,
  },
  {
    value: "absent",
    label: "Absent",
    short: "A",
    tone: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300",
    Icon: X,
  },
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
  const [showUnmarkedOnly, setShowUnmarkedOnly] = useState(false);

  const handleMarkAllPresent = () => {
    students.forEach((s) => {
      if (!stateMap[s.id]?.status) {
        setStudentStatus(s.id, "present");
      }
    });
  };

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
            <Badge variant="outline" className={cn("border gap-1", STATUSES[0].tone)}>
              <Check className="h-3 w-3" /> {summary.present}
            </Badge>
            <Badge variant="outline" className={cn("border gap-1", STATUSES[1].tone)}>
              <X className="h-3 w-3" /> {summary.absent}
            </Badge>
            <Badge variant="outline">Unmarked: {summary.unmarked}</Badge>
          </div>

          {canEdit && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                title="Mark all as present"
                disabled={saving || students.length === 0}
                className="inline-flex items-center justify-center gap-1.5 h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium transition-colors hover:bg-emerald-100 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Mark all
              </button>
              <button
                type="button"
                onClick={() => setShowUnmarkedOnly((v) => !v)}
                title={showUnmarkedOnly ? "Show all students" : "Show only unmarked"}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 h-10 w-full rounded-xl border text-sm font-medium transition-colors",
                  showUnmarkedOnly
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                <Filter className="h-4 w-4" />
                {summary.unmarked > 0 ? `${summary.unmarked} unmarked` : "Unmarked"}
              </button>
            </div>
          )}

          {(() => {
            const visible = showUnmarkedOnly
              ? students.filter((s) => !stateMap[s.id]?.status)
              : students;
            if (visible.length === 0) {
              return (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  All students marked. 🎉
                </div>
              );
            }
            return (
              <ul className="divide-y rounded-xl border bg-card shadow-sm overflow-hidden">
                {visible.map((s) => {
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
                      <div className="flex gap-2">
                        {STATUSES.map((opt) => {
                          const active = cur === opt.value;
                          const Icon = opt.Icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              aria-label={opt.label}
                              onClick={() =>
                                setStudentStatus(s.id, active ? null : opt.value)
                              }
                              className={cn(
                                "h-10 w-10 rounded-full border-2 flex items-center justify-center transition",
                                active
                                  ? cn(opt.tone, "border-current shadow-sm")
                                  : "bg-background text-muted-foreground border-border hover:bg-muted",
                              )}
                            >
                              <Icon className="h-5 w-5" strokeWidth={3} />
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
            );
          })()}

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