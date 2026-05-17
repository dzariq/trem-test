import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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
  kind: string | null;
  eligibleYears: string[];
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

interface UseEligibleCcaActivitiesOptions {
  /** The student ID to filter eligible activities for */
  studentId: string | null;
  /** Include inactive activities (default false) */
  includeInactive?: boolean;
  /** Filter by campus_code (for parent app) */
  campusCode?: string | null;
}

/**
 * Hook to fetch CCA activities that a student is eligible for,
 * based on the cca_club_year_eligibility table.
 * Uses the get_eligible_cca_activities RPC function.
 */
export function useEligibleCcaActivities(options: UseEligibleCcaActivitiesOptions) {
  const { studentId, includeInactive = false, campusCode } = options;

  const [activities, setActivities] = useState<CcaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!studentId) {
      setActivities([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get eligible activity IDs using RPC
      const { data: eligibleData, error: eligibleError } = await supabase.rpc(
        "get_eligible_cca_activities",
        { p_student_id: studentId }
      );

      if (eligibleError) {
        console.error("[useEligibleCcaActivities] RPC error:", eligibleError);
        throw eligibleError;
      }

      const eligibleIds = (eligibleData || []).map((r: any) => r.activity_id);

      if (eligibleIds.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Step 2: Fetch full activity details for eligible IDs
      let activitiesQuery = supabase
        .from("cca_activities")
        .select(`
          id,
          name,
          public_description,
          internal_notes,
          category,
          type_id,
          kind,
          classes_involved,
          cca_activity_types(id, name),
          meeting_day,
          meeting_time,
          location,
          is_active,
          max_participants,
          coordinator_name,
          coordinator_email,
          allow_free_text,
          image_url
        `)
        .in("id", eligibleIds);

      if (campusCode) {
        activitiesQuery = activitiesQuery.eq("campus_code", campusCode);
      }

      if (!includeInactive) {
        activitiesQuery = activitiesQuery.eq("is_active", true);
      }

      const { data: activitiesData, error: activitiesError } = await activitiesQuery;

      if (activitiesError) {
        console.error("[useEligibleCcaActivities] activities query failed:", activitiesError);
        throw activitiesError;
      }

      const rawActivities = activitiesData || [];
      const activityIds = rawActivities.map((a: any) => a.id);

      // Step 3: Fetch eligible years for these activities
      const { data: eligibilityData } = await supabase
        .from("cca_club_year_eligibility")
        .select("club_id, year_code")
        .in("club_id", activityIds);

      const eligibilityMap = new Map<string, string[]>();
      (eligibilityData || []).forEach((e: any) => {
        const existing = eligibilityMap.get(e.club_id) || [];
        existing.push(e.year_code);
        eligibilityMap.set(e.club_id, existing);
      });

      // Step 4: Fetch PIC teachers
      const picTeachersMap = new Map<string, CcaTeacher[]>();

      if (activityIds.length > 0) {
        const { data: teachersData } = await supabase
          .from("cca_activity_teachers")
          .select(`id, activity_id, teacher_user_id, role, is_primary`)
          .in("activity_id", activityIds);

        if (teachersData) {
          const teacherUserIds = [...new Set(teachersData.map((t: any) => t.teacher_user_id).filter(Boolean))];

          let teacherProfilesMap: Record<string, { full_name: string; departments: string[] }> = {};
          if (teacherUserIds.length > 0) {
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
              departments: profile?.departments || [],
            };
            const existing = picTeachersMap.get(t.activity_id) || [];
            existing.push(teacher);
            picTeachersMap.set(t.activity_id, existing);
          });
        }
      }

      // Step 5: Fetch sessions
      const sessionsMap = new Map<string, CcaSession[]>();

      if (activityIds.length > 0) {
        const { data: sessionsData } = await supabase
          .from("cca_sessions")
          .select(`id, activity_id, session_date, start_time, end_time, location, is_cancelled, description, custom_title, requirements`)
          .in("activity_id", activityIds)
          .eq("is_cancelled", false)
          .order("session_date", { ascending: true });

        if (sessionsData) {
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
      const mappedActivities: CcaActivity[] = rawActivities.map((a: any) => ({
        id: a.id,
        name: a.name,
        publicDescription: a.public_description,
        internalNotes: a.internal_notes,
        category: a.category || "Other",
        typeId: a.type_id || null,
        typeName: a.cca_activity_types?.name || null,
        kind: a.kind || null,
        eligibleYears: eligibilityMap.get(a.id) || [],
        classesInvolved: Array.isArray(a.classes_involved) ? a.classes_involved : [],
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

      // Filter out activities with no eligible years (strict enforcement)
      // Only show clubs that have at least one eligibility row in cca_club_year_eligibility
      const filteredActivities = mappedActivities.filter(
        (activity) => activity.eligibleYears.length > 0
      );

      // Sort by name
      filteredActivities.sort((a, b) => a.name.localeCompare(b.name));

      setActivities(filteredActivities);
    } catch (err: any) {
      console.error("[useEligibleCcaActivities] Error:", err);
      setError(err?.message || "Failed to load CCA activities");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, includeInactive, campusCode]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Filter by type ID (from cca_activity_types)
  const filterByTypeId = useCallback(
    (typeId: string) => {
      if (typeId === "all") return activities;
      return activities.filter((a) => a.typeId === typeId);
    },
    [activities]
  );

  // Filter by kind bucket: "all" | "club" | "outdoor" | "event"
  const filterByKind = useCallback(
    (kind: string) => {
      if (kind === "all") return activities;
      return activities.filter((a) => (a.kind || "club").toLowerCase() === kind);
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
    filterByTypeId,
    filterByKind,
    categories,
  };
}
