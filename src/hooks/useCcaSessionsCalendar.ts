import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface CcaCalendarSession {
  id: string;
  activityId: string;
  activityName: string;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  customTitle: string | null;
  description: string | null;
  requirements: string | null;
  isCancelled: boolean;
  category: string;
  kind?: string | null;
  classesInvolved: string[];
}

interface UseCcaSessionsCalendarOptions {
  year: number;
  month: number; // 1-12
  campusCode?: string | null;
  /**
   * When provided, restrict sessions to those visible to this student:
   * - club/outdoor: student must be actively enrolled
   * - event: student's class must be in cca_activities.classes_involved[]
   */
  studentId?: string | null;
  /**
   * Optional multi-student scoping. When provided alongside scopeToStudent
   * the visibility check is the UNION across all listed students. Takes
   * precedence over studentId when non-empty.
   */
  studentIds?: string[];
  /** Apply parent scoping when true and studentId provided */
  scopeToStudent?: boolean;
  /**
   * Apply teacher year-group scoping when true. Visible activities:
   * - club/outdoor: cca_activities.year_levels intersects teacherYearLevels
   * - event: cca_activities.classes_involved intersects teacherClassNames
   */
  scopeToTeacher?: boolean;
  teacherYearLevels?: string[];
  teacherClassNames?: string[];
  /**
   * When provided alongside scopeToTeacher, also include activities where
   * this user is a PIC / co-PIC / bus-PIC (regardless of year-group overlap).
   */
  teacherUserId?: string | null;
}

export function useCcaSessionsCalendar({
  year,
  month,
  campusCode,
  studentId,
  studentIds,
  scopeToStudent,
  scopeToTeacher,
  teacherYearLevels,
  teacherClassNames,
  teacherUserId,
}: UseCcaSessionsCalendarOptions) {
  const [sessions, setSessions] = useState<CcaCalendarSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range for the month (with buffer for week view)
      const startDate = new Date(year, month - 1, 1);
      startDate.setDate(startDate.getDate() - 7); // Buffer for previous month
      const endDate = new Date(year, month, 0);
      endDate.setDate(endDate.getDate() + 7); // Buffer for next month

      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      // Parent scoping: limit to activities the student(s) are enrolled in
      // (club/outdoor) or events whose classes_involved contains the
      // student's class. Supports a single studentId or many via studentIds.
      let scopedActivityIds: string[] | null = null;
      const effectiveStudentIds = (studentIds && studentIds.length > 0)
        ? studentIds
        : (studentId ? [studentId] : []);
      if (scopeToStudent && effectiveStudentIds.length > 0) {
        const { data: studentRows } = await supabase
          .from("students")
          .select("class")
          .in("id", effectiveStudentIds);
        const studentClasses = Array.from(new Set(
          (studentRows || [])
            .map((r: any) => r?.class)
            .filter(Boolean),
        ));

        const { data: enrollRows } = await supabase
          .from("student_cca_enrollments")
          .select("cca_activity_id")
          .in("student_id", effectiveStudentIds)
          .eq("status", "active");
        const enrolledIds = (enrollRows || [])
          .map((r: any) => r.cca_activity_id)
          .filter(Boolean);

        let eventIds: string[] = [];
        if (studentClasses.length > 0) {
          const { data: eventRows } = await supabase
            .from("cca_activities")
            .select("id")
            .eq("kind", "event")
            .eq("is_active", true)
            .overlaps("classes_involved", studentClasses);
          eventIds = (eventRows || []).map((r: any) => r.id);
        }

        scopedActivityIds = Array.from(new Set([...enrolledIds, ...eventIds]));
        if (scopedActivityIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }
      }

      // Teacher scoping: limit to activities tied to the teacher's assigned
      // year groups (clubs/outdoors via year_levels, events via classes_involved).
      if (scopeToTeacher) {
        const yls = (teacherYearLevels || []).filter(Boolean);
        const cns = (teacherClassNames || []).filter(Boolean);
        if (yls.length === 0 && cns.length === 0 && !teacherUserId) {
          setSessions([]);
          setLoading(false);
          return;
        }

        const ids = new Set<string>();
        // Activities where the teacher is PIC / co-PIC (any activity kind)
        if (teacherUserId) {
          const { data: picRows } = await supabase
            .from("cca_activity_teachers")
            .select("activity_id")
            .eq("teacher_user_id", teacherUserId);
          (picRows || []).forEach((r: any) => r?.activity_id && ids.add(r.activity_id));
          // Activities where teacher is bus PIC (outdoor)
          const { data: busRows } = await supabase
            .from("cca_outdoor_buses")
            .select("activity_id")
            .eq("pic_teacher_user_id", teacherUserId);
          (busRows || []).forEach((r: any) => r?.activity_id && ids.add(r.activity_id));
        }
        // Clubs / outdoors via year_levels overlap
        if (yls.length > 0) {
          const { data: coRows } = await supabase
            .from("cca_activities")
            .select("id")
            .in("kind", ["club", "outdoor"])
            .eq("is_active", true)
            .overlaps("year_levels", yls);
          (coRows || []).forEach((r: any) => r?.id && ids.add(r.id));
        }
        // Events via classes_involved overlap
        if (cns.length > 0) {
          const { data: evRows } = await supabase
            .from("cca_activities")
            .select("id")
            .eq("kind", "event")
            .eq("is_active", true)
            .overlaps("classes_involved", cns);
          (evRows || []).forEach((r: any) => r?.id && ids.add(r.id));
        }

        scopedActivityIds = Array.from(ids);
        if (scopedActivityIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from("cca_sessions")
        .select(`
          id,
          activity_id,
          session_date,
          start_time,
          end_time,
          location,
          location_id,
          custom_title,
          description,
          requirements,
          is_cancelled,
          cca_activities!inner(
            name,
            category,
            kind,
            classes_involved,
            campus_code
          ),
          school_locations(name)
        `)
        .gte("session_date", startStr)
        .lte("session_date", endStr)
        .eq("is_cancelled", false)
        .order("session_date", { ascending: true });

      if (scopedActivityIds) {
        query = query.in("activity_id", scopedActivityIds);
      }

      if (campusCode) {
        query = query.or(
          `campus_code.eq.${campusCode},campus_code.is.null`,
          { foreignTable: "cca_activities" }
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mapped: CcaCalendarSession[] = (data || []).map((s: any) => ({
        id: s.id,
        activityId: s.activity_id,
        activityName: s.cca_activities?.name || "Unknown Activity",
        sessionDate: s.session_date,
        startTime: s.start_time,
        endTime: s.end_time,
        locationName: s.school_locations?.name || s.location || null,
        customTitle: s.custom_title,
        description: s.description,
        requirements: s.requirements,
        isCancelled: s.is_cancelled,
        category: s.cca_activities?.category || "Other",
        kind: s.cca_activities?.kind ?? null,
        classesInvolved: Array.isArray(s.cca_activities?.classes_involved)
          ? s.cca_activities.classes_involved.filter(Boolean)
          : [],
      }));

      setSessions(mapped);
    } catch (err: any) {
      console.error("[useCcaSessionsCalendar] fetchSessions error:", err);
      setError(err?.message || "Failed to load CCA sessions");
    } finally {
      setLoading(false);
    }
  }, [
    year,
    month,
    campusCode,
    studentId,
    (studentIds || []).join(","),
    scopeToStudent,
    scopeToTeacher,
    (teacherYearLevels || []).join(","),
    (teacherClassNames || []).join(","),
    teacherUserId,
  ]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
}
