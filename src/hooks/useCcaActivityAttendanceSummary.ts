import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CcaSession } from "@/hooks/useCcaSessions";

export interface StudentAttendanceSummary {
  studentId: string;
  name: string;
  className: string | null;
  presentCount: number; // includes 'present' + 'late'
  absentCount: number; // 'absent'
  excusedCount: number; // 'excused'
  markedCount: number; // any non-null status
  totalPastSessions: number; // sessions on/before today (non-cancelled)
  percent: number; // presentCount / totalPastSessions (0-100, rounded)
}

interface Options {
  activityId: string | null | undefined;
  activityKind?: string | null;
  classesInvolved?: string[] | null;
  campusCode?: string | null;
  sessions: CcaSession[];
  /** Re-run when this changes (e.g. lastSavedAt from the marking screen). */
  refreshKey?: number;
}

/**
 * Roll-up of attendance per enrolled student for a CCA activity.
 * - Only past + today sessions count toward totals & percentages.
 * - Cancelled sessions are ignored.
 */
export function useCcaActivityAttendanceSummary({
  activityId,
  activityKind,
  classesInvolved,
  campusCode,
  sessions,
  refreshKey = 0,
}: Options) {
  const [rows, setRows] = useState<StudentAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sessions that already happened (today or earlier) and not cancelled.
  const pastSessions = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return sessions.filter(
      (s) => !s.isCancelled && s.sessionDate && s.sessionDate <= todayStr,
    );
  }, [sessions]);

  const sessionIds = useMemo(() => pastSessions.map((s) => s.id), [pastSessions]);

  const load = useCallback(async () => {
    if (!activityId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isEvent = (activityKind || "").toLowerCase() === "event";

      // 1) Roster
      let studentIds: string[] = [];
      if (!isEvent) {
        const { data, error: e1 } = await supabase
          .from("student_cca_enrollments")
          .select("student_id")
          .eq("cca_activity_id", activityId)
          .eq("status", "active");
        if (e1) throw e1;
        studentIds = (data || []).map((r: any) => r.student_id).filter(Boolean);
      }

      let students: { id: string; name: string; class: string | null }[] = [];
      if (studentIds.length > 0) {
        const { data, error: e2 } = await supabase
          .from("students")
          .select("id, name, class")
          .in("id", studentIds);
        if (e2) throw e2;
        students = (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          class: s.class ?? null,
        }));
      } else if ((classesInvolved?.length ?? 0) > 0) {
        let q = supabase
          .from("students")
          .select("id, name, class")
          .in("class", classesInvolved as string[])
          .eq("archived", false);
        if (campusCode) q = q.eq("campus_code", campusCode);
        const { data, error: e3 } = await q;
        if (e3) throw e3;
        students = (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          class: s.class ?? null,
        }));
      }

      // 2) Attendance for all past sessions
      let attendance: { student_id: string; status: string }[] = [];
      if (sessionIds.length > 0) {
        const { data, error: e4 } = await supabase
          .from("cca_session_attendance")
          .select("student_id, status")
          .in("session_id", sessionIds);
        if (e4) throw e4;
        attendance = (data || []) as any;
      }

      const total = pastSessions.length;
      const byStudent: Record<
        string,
        { present: number; absent: number; excused: number; marked: number }
      > = {};
      for (const a of attendance) {
        if (!a.student_id) continue;
        const s = (a.status || "").toLowerCase();
        const bucket =
          byStudent[a.student_id] ||
          (byStudent[a.student_id] = { present: 0, absent: 0, excused: 0, marked: 0 });
        if (s === "present" || s === "late") bucket.present += 1;
        else if (s === "absent") bucket.absent += 1;
        else if (s === "excused") bucket.excused += 1;
        if (s) bucket.marked += 1;
      }

      const summaries: StudentAttendanceSummary[] = students
        .map((stu) => {
          const b = byStudent[stu.id] || { present: 0, absent: 0, excused: 0, marked: 0 };
          const percent = total > 0 ? Math.round((b.present / total) * 100) : 0;
          return {
            studentId: stu.id,
            name: stu.name,
            className: stu.class,
            presentCount: b.present,
            absentCount: b.absent,
            excusedCount: b.excused,
            markedCount: b.marked,
            totalPastSessions: total,
            percent,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setRows(summaries);
    } catch (err: any) {
      console.error("[useCcaActivityAttendanceSummary] load failed:", err);
      setError(err?.message || "Failed to load attendance summary");
    } finally {
      setLoading(false);
    }
  }, [
    activityId,
    activityKind,
    (classesInvolved || []).join(","),
    campusCode,
    sessionIds.join(","),
    pastSessions.length,
  ]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { rows, loading, error, reload: load, totalPastSessions: pastSessions.length };
}