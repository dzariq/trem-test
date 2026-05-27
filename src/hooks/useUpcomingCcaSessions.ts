import { useState, useEffect, useCallback } from "react";
import { useRefetchOnResume } from "@/hooks/useRefreshOnAppResume";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useStudentSelection } from "@/hooks/useStudentSelection";

export interface UpcomingCcaSession {
  id: string;
  activityId: string;
  activityName: string;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  locationName: string | null;
  customTitle: string | null;
  description: string | null;
  category: string;
  kind?: string | null;
  isCca: true;
}

interface UseUpcomingCcaSessionsOptions {
  limit?: number;
  role?: "teacher" | "parent";
  /**
   * Optional explicit set of student IDs to scope the parent query to.
   * When provided (and non-empty), overrides the globally `selectedStudentId`
   * from context so callers can render an aggregated "All Children" view.
   * Ignored for the teacher role.
   */
  studentIds?: string[];
}

/**
 * Fetches upcoming CCA sessions visible to the current user.
 * - Teachers: see sessions for activities where they are PIC
 * - Parents: see sessions for activities their selected student is enrolled in (or eligible by year level)
 */
export function useUpcomingCcaSessions(options: UseUpcomingCcaSessionsOptions = {}) {
  const { user } = useAuth();
  const { profile } = useMyProfile();
  const { selectedStudentId } = useStudentSelection();
  const [sessions, setSessions] = useState<UpcomingCcaSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = options.limit ?? 10;
  const role = options.role ?? (profile?.role === "teacher" ? "teacher" : "parent");
  // Stable key so the callback doesn't re-fire on every render when a fresh
  // array reference is passed in.
  const studentIdsKey = (options.studentIds ?? []).slice().sort().join(",");

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString().split("T")[0];

      if (role === "teacher") {
        // For teachers: fetch sessions for activities where they are PIC
        const { data: picActivityIds, error: picError } = await supabase
          .from("cca_activity_teachers")
          .select("activity_id")
          .eq("teacher_user_id", user.id);

        if (picError) throw picError;
        
        const activityIds = (picActivityIds || []).map(r => r.activity_id);
        
        if (activityIds.length === 0) {
          setSessions([]);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("cca_sessions")
          .select(`
            id,
            activity_id,
            session_date,
            start_time,
            end_time,
            location,
            custom_title,
            description,
            is_cancelled,
            cca_activities!inner(name, category),
            school_locations(name)
          `)
          .in("activity_id", activityIds)
          .gte("session_date", now)
          .eq("is_cancelled", false)
          .order("session_date", { ascending: true })
          .limit(limit);

        if (fetchError) throw fetchError;

        const mapped: UpcomingCcaSession[] = (data || []).map((s: any) => ({
          id: s.id,
          activityId: s.activity_id,
          activityName: s.cca_activities?.name || "Unknown Activity",
          sessionDate: s.session_date,
          startTime: s.start_time,
          endTime: s.end_time,
          locationName: s.school_locations?.name || s.location || null,
          customTitle: s.custom_title,
          description: s.description,
          category: s.cca_activities?.category || "Other",
          kind: s.cca_activities?.kind ?? null,
          isCca: true,
        }));

        setSessions(mapped);
      } else {
        // For parents: scope by actual linkage.
        // - club/outdoor: student must be enrolled (student_cca_enrollments, status='active')
        // - event: student's class must be in cca_activities.classes_involved[]
        // Use explicit studentIds when provided (All Children scope); fall back
        // to the globally selected single student for legacy callers.
        const explicitIds = (options.studentIds ?? []).filter(Boolean);
        const targetIds =
          explicitIds.length > 0
            ? explicitIds
            : selectedStudentId
              ? [selectedStudentId]
              : [];
        if (targetIds.length === 0) {
          setSessions([]);
          return;
        }

        // Get each student's class so we can resolve event eligibility.
        const { data: studentRows, error: studentError } = await supabase
          .from("students")
          .select("id, class")
          .in("id", targetIds);
        if (studentError) throw studentError;
        const classes = Array.from(
          new Set(
            (studentRows || [])
              .map((r: any) => r.class)
              .filter((c: string | null): c is string => !!c)
          )
        );

        // 1. Enrolled activity IDs (clubs + outdoor) across all target students
        const { data: enrollRows, error: enrollErr } = await supabase
          .from("student_cca_enrollments")
          .select("cca_activity_id")
          .in("student_id", targetIds)
          .eq("status", "active");
        if (enrollErr) throw enrollErr;
        const enrolledIds = (enrollRows || [])
          .map((r: any) => r.cca_activity_id)
          .filter(Boolean);

        // 2. Event activities matching any student's class
        let eventIds: string[] = [];
        {
          // Include school-wide events (empty classes_involved) for everyone,
          // plus events whose classes_involved overlaps any student's class.
          const orParts: string[] = [
            "classes_involved.is.null",
            "classes_involved.eq.{}",
          ];
          if (classes.length > 0) {
            const arrLiteral = `{${classes.map((c) => `"${c}"`).join(",")}}`;
            orParts.push(`classes_involved.ov.${arrLiteral}`);
          }
          const { data: eventRows, error: eventErr } = await supabase
            .from("cca_activities")
            .select("id")
            .eq("kind", "event")
            .eq("is_active", true)
            .or(orParts.join(","));
          if (eventErr) throw eventErr;
          eventIds = (eventRows || []).map((r: any) => r.id);
        }

        const activityIds = Array.from(new Set([...enrolledIds, ...eventIds]));
        if (activityIds.length === 0) {
          setSessions([]);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("cca_sessions")
          .select(`
            id,
            activity_id,
            session_date,
            start_time,
            end_time,
            location,
            custom_title,
            description,
            is_cancelled,
            cca_activities!inner(name, category, kind, is_active),
            school_locations(name)
          `)
          .in("activity_id", activityIds)
          .gte("session_date", now)
          .eq("is_cancelled", false)
          .eq("cca_activities.is_active", true)
          .order("session_date", { ascending: true })
          .order("start_time", { ascending: true })
          .limit(limit);

        if (fetchError) throw fetchError;

        const mapped: UpcomingCcaSession[] = (data || []).map((s: any) => ({
          id: s.id,
          activityId: s.activity_id,
          activityName: s.cca_activities?.name || "Unknown Activity",
          sessionDate: s.session_date,
          startTime: s.start_time,
          endTime: s.end_time,
          locationName: s.school_locations?.name || s.location || null,
          customTitle: s.custom_title,
          description: s.description,
          category: s.cca_activities?.category || "Other",
          kind: s.cca_activities?.kind ?? null,
          isCca: true,
        }));

        setSessions(mapped);
      }
    } catch (err: any) {
      console.error("[useUpcomingCcaSessions] error:", err);
      setError(err?.message || "Failed to load CCA sessions");
    } finally {
      setLoading(false);
    }
  }, [user?.id, role, selectedStudentId, limit, studentIdsKey]);

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
