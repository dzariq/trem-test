import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { isStudentEligibleForCca } from "@/lib/yearLevelMapping";
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
  typeId: string | null;
  typeName: string | null;
  kind?: string | null;
  yearLevels: string[];
  classesInvolved: string[];
  meetingDay: string | null;
  meetingTime: string | null;
  location: string | null;
  isActive: boolean;
  maxParticipants: number | null;
  coordinatorName: string | null;
  coordinatorEmail: string | null;
  allowFreeText: boolean;
  imageUrl: string | null;
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
  /** Filter by campus code (BO/GL); also includes campus-agnostic rows */
  campusCode?: string | null;
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
    campusCode = null,
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
          type_id,
          cca_activity_types(id, name),
          year_levels,
          classes_involved,
          kind,
          meeting_day,
          meeting_time,
          location,
          is_active,
          max_participants,
          coordinator_name,
          coordinator_email,
          allow_free_text,
          image_url,
          campus_code
        `);

      if (!includeInactive) {
        activitiesQuery = activitiesQuery.eq("is_active", true);
      }

      if (campusCode) {
        activitiesQuery = activitiesQuery.or(
          `campus_code.eq.${campusCode},campus_code.is.null`
        );
      }

      const { data: activitiesData, error: activitiesError } = await activitiesQuery;

      if (activitiesError) {
        console.error("[useCcaActivities] activities query failed:", activitiesError);
        throw activitiesError;
      }


      const rawActivities = activitiesData || [];

      // Fetch all PIC teachers
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
            is_primary
          `)
          .in("activity_id", activityIds);

        if (teachersError) {
          console.error("[useCcaActivities] teachers query failed:", teachersError);
          // Non-fatal: continue without teachers
        } else if (teachersData) {
          // Collect unique teacher user IDs
          const teacherUserIds = [
            ...new Set(teachersData.map((t: any) => t.teacher_user_id).filter(Boolean)),
          ];

          // Fetch teacher profiles using security definer function (accessible to all authenticated users)
          let teacherProfilesMap: Record<string, { full_name: string; departments: string[] }> = {};
          if (teacherUserIds.length > 0) {
            // Use Promise.all to fetch all teacher profiles in parallel via RPC
            const profilePromises = teacherUserIds.map((userId) =>
              supabase.rpc("get_teacher_public_info", { p_teacher_user_id: userId })
            );
            const results = await Promise.all(profilePromises);

            results.forEach((result) => {
              if (result.data && result.data.length > 0) {
                const p = result.data[0];
                teacherProfilesMap[p.user_id] = {
                  full_name: p.full_name || "Unknown Teacher",
                  departments: Array.isArray(p.departments) ? p.departments : [],
                };
              }
            });
          }

          teachersData.forEach((t: any) => {
            const profile = teacherProfilesMap[t.teacher_user_id];
            const teacher: CcaTeacher = {
              id: t.id,
              teacherUserId: t.teacher_user_id,
              role: t.role || "pic",
              isPrimary: t.is_primary || false,
              fullName: profile?.full_name || "Unknown Teacher",
              departments: normalizeDepartments(profile?.departments),
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
        typeId: a.type_id || null,
        typeName: a.cca_activity_types?.name || null,
        kind: a.kind ?? null,
        yearLevels: normalizeYearLevels(a.year_levels),
        classesInvolved: Array.isArray(a.classes_involved) ? a.classes_involved.filter(Boolean) : [],
        meetingDay: a.meeting_day,
        meetingTime: a.meeting_time,
        location: a.location,
        isActive: a.is_active,
        maxParticipants: a.max_participants,
        coordinatorName: a.coordinator_name,
        coordinatorEmail: a.coordinator_email,
        allowFreeText: a.allow_free_text ?? false,
        imageUrl: a.image_url || null,
        picTeachers: picTeachersMap.get(a.id) || [],
        sessions: sessionsMap.get(a.id) || [],
      }));

      // Filter by myActivitiesOnly if requested
      if (myActivitiesOnly && currentUserId) {
        mappedActivities = mappedActivities.filter((activity) =>
          activity.picTeachers.some((t) => t.teacherUserId === currentUserId)
        );
      }

      // Filter by student year level eligibility using Key Stage mapping
      if (studentYearLevel !== undefined) {
        mappedActivities = mappedActivities.filter((activity) => {
          return isStudentEligibleForCca(studentYearLevel, activity.yearLevels);
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
  }, [studentYearLevel, myActivitiesOnly, currentUserId, includeInactive, campusCode]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Filter by category (legacy) or type ID
  const filterByCategory = useCallback(
    (category: string) => {
      if (category === "all") return activities;
      return activities.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    },
    [activities]
  );

  // Filter by type ID (from cca_activity_types)
  const filterByTypeId = useCallback(
    (typeId: string) => {
      if (typeId === "all") return activities;
      return activities.filter((a) => a.typeId === typeId);
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
    filterByTypeId,
    categories,
  };
}
