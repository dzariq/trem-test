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
          isCca: true,
        }));

        setSessions(mapped);
      } else {
        // For parents: fetch sessions for activities by student year level
        if (!selectedStudentId) {
          setSessions([]);
          return;
        }

        // Get student's year level
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("year_level")
          .eq("id", selectedStudentId)
          .maybeSingle();

        if (studentError) throw studentError;
        
        const yearLevel = studentData?.year_level || null;

        // Fetch upcoming sessions with activity info
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
            cca_activities!inner(name, category, year_levels, is_active),
            school_locations(name)
          `)
          .gte("session_date", now)
          .eq("is_cancelled", false)
          .eq("cca_activities.is_active", true)
          .order("session_date", { ascending: true })
          .limit(50);

        if (fetchError) throw fetchError;

        // Filter by year level eligibility on client side
        const filtered = (data || []).filter((s: any) => {
          const yearLevels = s.cca_activities?.year_levels;
          if (!yearLevels || !Array.isArray(yearLevels) || yearLevels.length === 0) {
            return true; // No restriction = all years
          }
          if (yearLevels.includes("All")) {
            return true;
          }
          return yearLevel && yearLevels.includes(yearLevel);
        });

        const mapped: UpcomingCcaSession[] = filtered.slice(0, limit).map((s: any) => ({
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
