import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Types
export interface CcaTeacher {
  id: string;
  teacherUserId: string;
  role: string;
  isPrimary: boolean;
  fullName: string;
  departments: string[];
}

export interface CcaSession {
  id: string;
  activityId: string;
  sessionDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  isCancelled: boolean;
  description: string | null;
  customTitle: string | null;
  requirements: string | null;
}

export interface CcaActivity {
  id: string;
  name: string;
  publicDescription: string | null;
  internalNotes: string | null;
  category: string;
  yearLevels: string[];
  meetingDay: string | null;
  meetingTime: string | null;
  location: string | null;
  isActive: boolean;
  maxParticipants: number | null;
  coordinatorName: string | null;
  coordinatorEmail: string | null;
  picTeachers: CcaTeacher[];
  sessions: CcaSession[];
}

interface UseCcaActivitiesOptions {
  /** Filter by student year level (for parent app) */
  studentYearLevel?: string | null;
  /** Only show activities where current user is assigned (for teacher app) */
  myActivitiesOnly?: boolean;
  /** Current user ID (for teacher filtering) */
  currentUserId?: string | null;
  /** Include inactive activities */
  includeInactive?: boolean;
}

// Helper: normalize year levels from various formats
const normalizeYearLevels = (yearLevels: unknown): string[] => {
  if (Array.isArray(yearLevels)) {
    return yearLevels.map((level) => String(level));
  }
  if (typeof yearLevels === "string") {
    const trimmed = yearLevels.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const normalized = trimmed.startsWith("{")
        ? `[${trimmed.slice(1, -1)}]`
        : trimmed;
      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          return parsed.map((level) => String(level));
        }
      } catch {
        // Fall through to simple split
      }
    }
    return trimmed
      .replace(/[{}[\]"]/g, "")
      .split(",")
      .map((level) => level.trim())
      .filter(Boolean);
  }
  return [];
};

// Helper: normalize departments array from user_profiles
const normalizeDepartments = (departments: unknown): string[] => {
  if (Array.isArray(departments)) {
    return departments.map((d) => String(d)).filter(Boolean);
  }
  if (typeof departments === "string") {
    return departments.split(",").map((d) => d.trim()).filter(Boolean);
  }
  return [];
};

export function useCcaActivities(options: UseCcaActivitiesOptions = {}) {
  const {
    studentYearLevel,
    myActivitiesOnly = false,
    currentUserId,
    includeInactive = false,
  } = options;

  const [activities, setActivities] = useState<CcaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build activities query
      let activitiesQuery = supabase
        .from("cca_activities")
        .select(`
          id,
          name,
          public_description,
          internal_notes,
          category,
          year_levels,
          meeting_day,
          meeting_time,
          location,
          is_active,
          max_participants,
          coordinator_name,
          coordinator_email
        `);

      if (!includeInactive) {
        activitiesQuery = activitiesQuery.eq("is_active", true);
      }

      const { data: activitiesData, error: activitiesError } = await activitiesQuery;

      if (activitiesError) {
        console.error("[useCcaActivities] activities query failed:", activitiesError);
        throw activitiesError;
      }


      const rawActivities = activitiesData || [];

      // Fetch all PIC teachers with user profile info
      const activityIds = rawActivities.map((a) => a.id);
      let picTeachersMap = new Map<string, CcaTeacher[]>();

      if (activityIds.length > 0) {
        const { data: teachersData, error: teachersError } = await supabase
          .from("cca_activity_teachers")
          .select(`
            id,
            activity_id,
            teacher_user_id,
            role,
            is_primary,
            user_profiles!cca_activity_teachers_teacher_user_id_fkey (
              full_name,
              departments
            )
          `)
          .in("activity_id", activityIds);

        if (teachersError) {
          console.error("[useCcaActivities] teachers query failed:", teachersError);
          // Non-fatal: continue without teachers
        } else if (teachersData) {
          teachersData.forEach((t: any) => {
            const teacher: CcaTeacher = {
              id: t.id,
              teacherUserId: t.teacher_user_id,
              role: t.role || "pic",
              isPrimary: t.is_primary || false,
              fullName: t.user_profiles?.full_name || "Unknown Teacher",
              departments: normalizeDepartments(t.user_profiles?.departments),
            };
            const existing = picTeachersMap.get(t.activity_id) || [];
            existing.push(teacher);
            picTeachersMap.set(t.activity_id, existing);
          });
        }
      }

      // Fetch sessions for activities
      let sessionsMap = new Map<string, CcaSession[]>();

      if (activityIds.length > 0) {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("cca_sessions")
          .select(`
            id,
            activity_id,
            session_date,
            start_time,
            end_time,
            location,
            is_cancelled,
            description,
            custom_title,
            requirements
          `)
          .in("activity_id", activityIds)
          .eq("is_cancelled", false)
          .order("session_date", { ascending: true });

        if (sessionsError) {
          console.error("[useCcaActivities] sessions query failed:", sessionsError);
          // Non-fatal: continue without sessions
        } else if (sessionsData) {
          sessionsData.forEach((s: any) => {
            const session: CcaSession = {
              id: s.id,
              activityId: s.activity_id,
              sessionDate: s.session_date,
              startTime: s.start_time,
              endTime: s.end_time,
              location: s.location,
              isCancelled: s.is_cancelled || false,
              description: s.description,
              customTitle: s.custom_title,
              requirements: s.requirements,
            };
            const existing = sessionsMap.get(s.activity_id) || [];
            existing.push(session);
            sessionsMap.set(s.activity_id, existing);
          });
        }
      }

      // Map to typed activities
      let mappedActivities: CcaActivity[] = rawActivities.map((a: any) => ({
        id: a.id,
        name: a.name,
        publicDescription: a.public_description,
        internalNotes: a.internal_notes,
        category: a.category || "Other",
        yearLevels: normalizeYearLevels(a.year_levels),
        meetingDay: a.meeting_day,
        meetingTime: a.meeting_time,
        location: a.location,
        isActive: a.is_active,
        maxParticipants: a.max_participants,
        coordinatorName: a.coordinator_name,
        coordinatorEmail: a.coordinator_email,
        picTeachers: picTeachersMap.get(a.id) || [],
        sessions: sessionsMap.get(a.id) || [],
      }));

      // Filter by myActivitiesOnly if requested
      if (myActivitiesOnly && currentUserId) {
        mappedActivities = mappedActivities.filter((activity) =>
          activity.picTeachers.some((t) => t.teacherUserId === currentUserId)
        );
      }

      // Filter by student year level eligibility (for parent app)
      if (studentYearLevel !== undefined) {
        mappedActivities = mappedActivities.filter((activity) => {
          const levels = activity.yearLevels;
          if (levels.includes("All")) return true;
          if (!studentYearLevel) return levels.includes("All");
          return levels.includes(studentYearLevel);
        });
      }


      // Sort by name
      mappedActivities.sort((a, b) => a.name.localeCompare(b.name));

      setActivities(mappedActivities);
    } catch (err: any) {
      console.error("[useCcaActivities] Error:", err);
      setError(err?.message || "Failed to load CCA activities");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [studentYearLevel, myActivitiesOnly, currentUserId, includeInactive]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Filter by category
  const filterByCategory = useCallback(
    (category: string) => {
      if (category === "all") return activities;
      return activities.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    },
    [activities]
  );

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(activities.map((a) => a.category));
    return Array.from(cats).sort();
  }, [activities]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
    filterByCategory,
    categories,
  };
}
