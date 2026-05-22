import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export type CcaAttendanceStatus = "present" | "absent" | "late" | "excused";

export interface CcaAttendanceStudent {
  id: string;
  name: string;
  class: string | null;
}

export interface CcaAttendanceState {
  status: CcaAttendanceStatus | null;
  notes: string;
}

interface UseCcaSessionAttendanceOptions {
  sessionId: string | null | undefined;
  activityId: string | null | undefined;
  activityKind?: string | null;
  classesInvolved?: string[] | null;
  campusCode?: string | null;
  enabled?: boolean;
}

/**
 * Loads the roster and existing attendance for a CCA session.
 *
 * Roster source:
 * - Clubs / outdoors: students from `student_cca_enrollments` (status='active')
 *   for this `activityId`.
 * - Events: fall back to all students whose class is listed in
 *   `cca_activities.classes_involved`.
 */
export function useCcaSessionAttendance({
  sessionId,
  activityId,
  activityKind,
  classesInvolved,
  campusCode,
  enabled = true,
}: UseCcaSessionAttendanceOptions) {
  const [students, setStudents] = useState<CcaAttendanceStudent[]>([]);
  const [stateMap, setStateMap] = useState<Record<string, CcaAttendanceState>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number>(0);

  const reload = useCallback(async () => {
    if (!enabled || !sessionId) {
      setStudents([]);
      setStateMap({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isEvent = (activityKind || "").toLowerCase() === "event";
      let studentIds: string[] = [];

      // 1) Club / outdoor roster: students enrolled in the activity
      if (!isEvent && activityId) {
        const { data: clubRows, error: clubErr } = await supabase
          .from("student_cca_enrollments")
          .select("student_id")
          .eq("cca_activity_id", activityId)
          .eq("status", "active");
        if (clubErr) throw clubErr;
        studentIds = (clubRows || [])
          .map((r: any) => r.student_id)
          .filter(Boolean);
      }

      // 2) Event fallback (or club with no enrollments): by classes_involved
      // Only events fall back to class-based rosters. Clubs and outdoor
      // activities are strictly enrollment-driven — showing class students
      // when no one is enrolled creates the illusion of phantom members and
      // disagrees with the Members tab.
      if (isEvent && studentIds.length === 0 && (classesInvolved?.length ?? 0) > 0) {
        let q = supabase
          .from("students")
          .select("id, name, class")
          .in("class", classesInvolved as string[])
          .eq("archived", false);
        if (campusCode) q = q.eq("campus_code", campusCode);
        const { data: classRows, error: classErr } = await q;
        if (classErr) throw classErr;
        const list: CcaAttendanceStudent[] = (classRows || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          class: s.class ?? null,
        }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(list);
        studentIds = list.map((s) => s.id);
      } else if (studentIds.length > 0) {
        const { data: studentRows, error: sErr } = await supabase
          .from("students")
          .select("id, name, class")
          .in("id", studentIds);
        if (sErr) throw sErr;
        const list: CcaAttendanceStudent[] = (studentRows || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          class: s.class ?? null,
        }));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(list);
      } else {
        setStudents([]);
      }

      // 3) Existing attendance
      const { data: attRows, error: attErr } = await supabase
        .from("cca_session_attendance")
        .select("student_id, status, notes")
        .eq("session_id", sessionId);
      if (attErr) throw attErr;

      const map: Record<string, CcaAttendanceState> = {};
      studentIds.forEach((id) => {
        map[id] = { status: null, notes: "" };
      });
      (attRows || []).forEach((r: any) => {
        if (!r?.student_id) return;
        const status = (r.status || "").toLowerCase();
        const allowed: CcaAttendanceStatus[] = ["present", "absent", "late", "excused"];
        map[r.student_id] = {
          status: (allowed as string[]).includes(status) ? (status as CcaAttendanceStatus) : null,
          notes: r.notes || "",
        };
      });
      setStateMap(map);
    } catch (err: any) {
      console.error("[useCcaSessionAttendance] load failed:", err);
      setError(err?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, [enabled, sessionId, activityId, activityKind, (classesInvolved || []).join(","), campusCode]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setStudentStatus = useCallback((studentId: string, status: CcaAttendanceStatus | null) => {
    setStateMap((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { status: null, notes: "" }), status },
    }));
  }, []);

  const setStudentNotes = useCallback((studentId: string, notes: string) => {
    setStateMap((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { status: null, notes: "" }), notes },
    }));
  }, []);

  const save = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!sessionId) return { success: false, message: "No session selected." };
    const marked = students.filter((s) => stateMap[s.id]?.status);
    if (marked.length === 0) {
      return { success: false, message: "Mark at least one student before saving." };
    }
    setSaving(true);
    try {
      const userRes = await supabase.auth.getUser();
      const uid = userRes.data.user?.id || null;
      const rows = marked.map((s) => ({
        session_id: sessionId,
        student_id: s.id,
        status: stateMap[s.id].status as CcaAttendanceStatus,
        notes: stateMap[s.id].notes || null,
        marked_by: uid,
        marked_at: new Date().toISOString(),
      }));
      const { error: upErr } = await supabase
        .from("cca_session_attendance")
        .upsert(rows, { onConflict: "session_id,student_id" });
      if (upErr) throw upErr;
      setLastSavedAt(Date.now());
      return { success: true, message: `Saved attendance for ${marked.length} student(s).` };
    } catch (err: any) {
      console.error("[useCcaSessionAttendance] save failed:", err);
      const msg = err?.message || "Failed to save attendance";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
      return { success: false, message: msg };
    } finally {
      setSaving(false);
    }
  }, [sessionId, students, stateMap]);

  const summary = useMemo(() => {
    const values = Object.values(stateMap);
    return {
      present: values.filter((v) => v.status === "present").length,
      absent: values.filter((v) => v.status === "absent").length,
      late: values.filter((v) => v.status === "late").length,
      excused: values.filter((v) => v.status === "excused").length,
      unmarked: students.length - values.filter((v) => v.status).length,
      total: students.length,
    };
  }, [stateMap, students.length]);

  return {
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
    reload,
  };
}