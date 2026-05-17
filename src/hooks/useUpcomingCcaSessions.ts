import { useState, useEffect, useCallback } from "react";
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
        if (!selectedStudentId) {
          setSessions([]);
          return;
        }

        // Get student's class
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("class")
          .eq("id", selectedStudentId)
          .maybeSingle();

        if (studentError) throw studentError;
        const studentClass = studentData?.class || null;

        // 1. Enrolled activity IDs (clubs + outdoor) — direct tagging
        const { data: enrollRows, error: enrollErr } = await supabase
          .from("student_cca_enrollments")
          .select("cca_activity_id")
          .eq("student_id", selectedStudentId)
          .eq("status", "active");
        if (enrollErr) throw enrollErr;
        const enrolledIds = (enrollRows || []).map((r: any) => r.cca_activity_id).filter(Boolean);

        // 2. Event activities matching student's class
        let eventIds: string[] = [];
        if (studentClass) {
          const { data: eventRows, error: eventErr } = await supabase
            .from("cca_activities")
            .select("id")
            .eq("kind", "event")
            .eq("is_active", true)
            .contains("classes_involved", [studentClass]);
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
  }, [user?.id, role, selectedStudentId, limit]);

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
