import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Clock, MapPin, ClipboardList, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useCcaSessions } from "@/hooks/useCcaSessions";
import { formatSessionTimeRange } from "@/lib/ccaSessionFormat";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "late" | "excused";

const STATUS_STYLES: Record<Status, string> = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  absent: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  late: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  excused: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
};

const STATUS_LABEL: Record<Status, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

function fmtDate(s: string) {
  try {
    return format(parseISO(s), "EEE, d MMM yyyy");
  } catch {
    return s;
  }
}

interface ParentAttendancePanelProps {
  activityId: string;
  studentId: string | null;
  studentName?: string | null;
}

/**
 * Read-only attendance view for a parent: shows every session of the CCA
 * with the selected child's status (or "—" when not recorded). Filters
 * strictly by student_id so no other child's data is visible.
 */
export function ParentAttendancePanel({
  activityId,
  studentId,
  studentName,
}: ParentAttendancePanelProps) {
  const { sessions, loading: sessionsLoading, fetchSessions } = useCcaSessions({
    activityId,
  });
  const [attMap, setAttMap] = useState<Record<string, Status>>({});
  const [attLoading, setAttLoading] = useState(false);

  useEffect(() => {
    if (activityId) fetchSessions();
  }, [activityId, fetchSessions]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!studentId || sessions.length === 0) {
        setAttMap({});
        return;
      }
      setAttLoading(true);
      try {
        const sessionIds = sessions.map((s) => s.id);
        const { data, error } = await supabase
          .from("cca_session_attendance")
          .select("session_id, status")
          .eq("student_id", studentId)
          .in("session_id", sessionIds);
        if (error) throw error;
        if (cancelled) return;
        const m: Record<string, Status> = {};
        const allowed: Status[] = ["present", "absent", "late", "excused"];
        (data ?? []).forEach((r: any) => {
          const s = (r?.status || "").toLowerCase();
          if (allowed.includes(s as Status)) m[r.session_id] = s as Status;
        });
        setAttMap(m);
      } catch (e) {
        console.error("[ParentAttendancePanel] load failed", e);
        if (!cancelled) setAttMap({});
      } finally {
        if (!cancelled) setAttLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId, sessions]);

  const ordered = useMemo(() => {
    return [...sessions]
      .filter((s) => !s.isCancelled)
      .sort((a, b) => (b.sessionDate || "").localeCompare(a.sessionDate || ""));
  }, [sessions]);

  const totals = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0, none: 0 };
    ordered.forEach((s) => {
      const v = attMap[s.id];
      if (v) counts[v]++;
      else counts.none++;
    });
    return counts;
  }, [ordered, attMap]);

  if (!studentId) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        Please select a child to view attendance.
      </div>
    );
  }

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (ordered.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
        No sessions yet.
      </div>
    );
  }

  const recorded = totals.present + totals.late;
  const totalRecorded =
    totals.present + totals.absent + totals.late + totals.excused;

  return (
    <div className="space-y-4">
      {studentName && (
        <p className="text-xs text-muted-foreground">
          Showing attendance for <span className="font-medium text-foreground">{studentName}</span>
        </p>
      )}

      <Card className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
        <CardContent className="p-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium text-foreground">
            {recorded}/{Math.max(totalRecorded, 1)} attended
          </span>
          <span className="text-muted-foreground">·</span>
          <span><Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES.present)}>Present {totals.present}</Badge></span>
          <span><Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES.absent)}>Absent {totals.absent}</Badge></span>
          <span><Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES.late)}>Late {totals.late}</Badge></span>
          <span><Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES.excused)}>Excused {totals.excused}</Badge></span>
        </CardContent>
      </Card>

      {attLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Refreshing…
        </div>
      )}

      <ul className="space-y-2">
        {ordered.map((s) => {
          const status = attMap[s.id];
          const time = formatSessionTimeRange(s.startTime, s.endTime);
          return (
            <li key={s.id}>
              <Card className="rounded-lg">
                <CardContent className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {fmtDate(s.sessionDate)}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                      {time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {time}
                        </span>
                      )}
                      {s.locationName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {s.locationName}
                        </span>
                      )}
                    </div>
                  </div>
                  {status ? (
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] shrink-0", STATUS_STYLES[status])}
                    >
                      {STATUS_LABEL[status]}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">
                      —
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}