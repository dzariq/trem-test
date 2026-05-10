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
}

interface UseCcaSessionsCalendarOptions {
  year: number;
  month: number; // 1-12
  campusCode?: string | null;
}

export function useCcaSessionsCalendar({ year, month, campusCode }: UseCcaSessionsCalendarOptions) {
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
            campus_code
          ),
          school_locations(name)
        `)
        .gte("session_date", startStr)
        .lte("session_date", endStr)
        .eq("is_cancelled", false)
        .order("session_date", { ascending: true });

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
      }));

      setSessions(mapped);
    } catch (err: any) {
      console.error("[useCcaSessionsCalendar] fetchSessions error:", err);
      setError(err?.message || "Failed to load CCA sessions");
    } finally {
      setLoading(false);
    }
  }, [year, month, campusCode]);

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
