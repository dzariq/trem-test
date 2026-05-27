import { useState, useEffect, useCallback } from "react";
import { useRefetchOnResume } from "@/hooks/useRefreshOnAppResume";
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
        {
          // Include school-wide events (empty/null classes_involved) plus
          // events whose classes_involved overlaps the student's class.
          const orParts: string[] = [
            "classes_involved.is.null",
            "classes_involved.eq.{}",
          ];
          if (studentClasses.length > 0) {
            const arrLiteral = `{${studentClasses.map((c) => `"${c}"`).join(",")}}`;
            orParts.push(`classes_involved.ov.${arrLiteral}`);
          }
          const { data: eventRows } = await supabase
            .from("cca_activities")
            .select("id")
            .eq("kind", "event")
            .eq("is_active", true)
            .or(orParts.join(","));
          eventIds = (eventRows || []).map((r: any) => r.id);
        }

        scopedActivityIds = Array.from(new Set([...enrolledIds, ...eventIds]));
        if (scopedActivityIds.length === 0) {
          setSessions([]);
          setLoading(false);
          return;
        }
      }

      // Teacher scoping: limit to activities the teacher actually PICs.
      // Only Main/Sub PIC on the activity OR Bus PIC on an outdoor CCA are
      // included. Year-level / class-name overlap is intentionally NOT used.
      if (scopeToTeacher) {
        if (!teacherUserId) {
          setSessions([]);
          setLoading(false);
          return;
        }

        const ids = new Set<string>();
        const { data: picRows } = await supabase
          .from("cca_activity_teachers")
          .select("activity_id")
          .eq("teacher_user_id", teacherUserId);
        (picRows || []).forEach(
          (r: any) => r?.activity_id && ids.add(r.activity_id)
        );

        const { data: busRows } = await supabase
          .from("cca_outdoor_buses")
          .select("activity_id")
          .or(
            `teacher_pic_main.eq.${teacherUserId},teacher_pic_sub.eq.${teacherUserId}`
          );
        (busRows || []).forEach(
          (r: any) => r?.activity_id && ids.add(r.activity_id)
        );

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

  useRefetchOnResume(fetchSessions);

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
}
