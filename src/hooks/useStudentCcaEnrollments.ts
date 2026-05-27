import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";

export interface EnrolledCcaActivity {
  id: string;
  enrollmentId: string;
  activityId: string;
  name: string;
  category: string | null;
  typeId: string | null;
  typeName: string | null;
  kind: string | null;
  meetingDay: string | null;
  meetingTime: string | null;
  location: string | null;
  publicDescription: string | null;
  enrollmentStatus: string;
  imageUrl: string | null;
  picTeachers: {
    fullName: string;
    departments: string[];
    isPrimary?: boolean;
    role?: string;
  }[];
  /** Soonest upcoming non-cancelled session date (YYYY-MM-DD) or null. */
  nextSessionDate: string | null;
  /** Children (out of the requested set) enrolled in this activity. */
  enrolledStudents: { id: string; name: string }[];
}

interface UseStudentCcaEnrollmentsOptions {
  studentId: string | string[] | null;
}

/**
 * Hook to fetch CCA activities that a student is enrolled in.
 * Used in parent calendar to show "My CCAs (Enrolled)" section.
 */
export function useStudentCcaEnrollments({ studentId }: UseStudentCcaEnrollmentsOptions) {
  const [enrollments, setEnrollments] = useState<EnrolledCcaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedIds = useMemo(() => {
    if (!studentId) return [] as string[];
    const arr = Array.isArray(studentId) ? studentId : [studentId];
    return Array.from(new Set(arr.filter((id): id is string => !!id)));
  }, [studentId]);
  const idsKey = normalizedIds.join(",");

  const fetchEnrollments = useCallback(async () => {
    if (normalizedIds.length === 0) {
      setEnrollments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch enrollments with activity details
      const { data, error: fetchError } = await supabase
        .from("student_cca_enrollments")
        .select(`
          id,
          student_id,
          cca_activity_id,
          status,
          cca_activities(
            id,
            name,
            category,
            type_id,
            kind,
            cca_activity_types(id, name),
            meeting_day,
            meeting_time,
            location,
            public_description,
            is_active,
            image_url
          )
        `)
        .in("student_id", normalizedIds)
        .eq("status", "active");

      if (fetchError) throw fetchError;

      // Filter out inactive activities and map to our shape
      const activeEnrollments = (data || [])
        .filter((e: any) => e.cca_activities?.is_active !== false)
        .map((e: any) => e.cca_activity_id);

      if (activeEnrollments.length === 0) {
        setEnrollments([]);
        setLoading(false);
        return;
      }

      // Fetch student names (for tagging in multi-child mode).
      const { data: studentRows } = await supabase
        .from("students")
        .select("id, name")
        .in("id", normalizedIds);
      const studentNameById = new Map<string, string>(
        (studentRows || []).map((s: any) => [s.id, s.name as string])
      );

      // Fetch PIC teachers for these activities
      const { data: teachersData } = await supabase
        .from("cca_activity_teachers")
        .select(`
          id,
          activity_id,
          is_primary,
          role,
          teacher_user_id
        `)
        .in("activity_id", activeEnrollments);

      // Collect unique teacher user IDs to fetch using security definer function
      const teacherUserIds = [
        ...new Set((teachersData || []).map((t: any) => t.teacher_user_id).filter(Boolean)),
      ];

      // Fetch teacher info using the security definer function (accessible to parents)
      let teacherProfilesMap: Record<string, { full_name: string; departments: string[] }> = {};
      if (teacherUserIds.length > 0) {
        // Use Promise.all to fetch all teacher profiles in parallel via RPC
        const profilePromises = teacherUserIds.map((userId) =>
          supabase.rpc("get_teacher_public_info", { p_teacher_user_id: userId })
        );
        const results = await Promise.all(profilePromises);

        results.forEach((result, index) => {
          if (result.data && result.data.length > 0) {
            const p = result.data[0];
            teacherProfilesMap[p.user_id] = {
              full_name: p.full_name || "Unknown",
              departments: Array.isArray(p.departments) ? p.departments : [],
            };
          }
        });
      }

      // Group teachers by activity
      const teachersByActivity: Record<string, EnrolledCcaActivity["picTeachers"]> = {};
      (teachersData || []).forEach((t: any) => {
        const actId = t.activity_id;
        if (!teachersByActivity[actId]) {
          teachersByActivity[actId] = [];
        }
        const profile = teacherProfilesMap[t.teacher_user_id];
        teachersByActivity[actId].push({
          fullName: profile?.full_name || "Unknown",
          departments: profile?.departments || [],
          isPrimary: t.is_primary || false,
          role: t.role || undefined,
        });
      });

      // Fetch upcoming sessions to compute nextSessionDate per activity
      const todayStr = new Date().toISOString().slice(0, 10);
      const nextByActivity: Record<string, string> = {};
      const { data: sessionRows } = await supabase
        .from("cca_sessions")
        .select("activity_id, session_date, is_cancelled")
        .in("activity_id", activeEnrollments)
        .eq("is_cancelled", false)
        .gte("session_date", todayStr)
        .order("session_date", { ascending: true });
      (sessionRows || []).forEach((s: any) => {
        if (!nextByActivity[s.activity_id]) {
          nextByActivity[s.activity_id] = s.session_date;
        }
      });

      // Map + de-dup by activity (merge children enrolled in the same activity).
      const byActivity = new Map<string, EnrolledCcaActivity>();
      (data || [])
        .filter((e: any) => e.cca_activities?.is_active !== false)
        .forEach((e: any) => {
          const actId = e.cca_activity_id;
          const childId = e.student_id as string;
          const childName = studentNameById.get(childId) || "";
          const existing = byActivity.get(actId);
          if (existing) {
            if (!existing.enrolledStudents.some((s) => s.id === childId)) {
              existing.enrolledStudents.push({ id: childId, name: childName });
            }
            return;
          }
          byActivity.set(actId, {
            id: e.cca_activities?.id || actId,
            enrollmentId: e.id,
            activityId: actId,
            name: e.cca_activities?.name || "Unknown Activity",
            category: e.cca_activities?.category || null,
            typeId: e.cca_activities?.type_id || null,
            typeName: e.cca_activities?.cca_activity_types?.name || null,
            kind: e.cca_activities?.kind || null,
            meetingDay: e.cca_activities?.meeting_day || null,
            meetingTime: e.cca_activities?.meeting_time || null,
            location: e.cca_activities?.location || null,
            publicDescription: e.cca_activities?.public_description || null,
            enrollmentStatus: e.status,
            imageUrl: e.cca_activities?.image_url || null,
            picTeachers: teachersByActivity[actId] || [],
            nextSessionDate: nextByActivity[actId] || null,
            enrolledStudents: [{ id: childId, name: childName }],
          });
        });
      const mapped: EnrolledCcaActivity[] = Array.from(byActivity.values());

      // Sort: soonest upcoming first (nulls last), then by name
      mapped.sort((a, b) => {
        const ak = a.nextSessionDate ?? "\uffff";
        const bk = b.nextSessionDate ?? "\uffff";
        if (ak !== bk) return ak.localeCompare(bk);
        return a.name.localeCompare(b.name);
      });

      setEnrollments(mapped);
    } catch (err: any) {
      console.error("[useStudentCcaEnrollments] error:", err);
      setError(err?.message || "Failed to load enrolled CCAs");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const filterByCategory = useCallback(
    (category: string) => {
      if (category === "all") return enrollments;
      return enrollments.filter(
        (e) => (e.category || "").toLowerCase() === category.toLowerCase()
      );
    },
    [enrollments]
  );

  // Filter by type ID (from cca_activity_types)
  const filterByTypeId = useCallback(
    (typeId: string) => {
      if (typeId === "all") return enrollments;
      return enrollments.filter((e) => e.typeId === typeId);
    },
    [enrollments]
  );

  // Filter by kind bucket: "all" | "club" | "outdoor" | "event"
  const filterByKind = useCallback(
    (kind: string) => {
      if (kind === "all") return enrollments;
      return enrollments.filter((e) => (e.kind || "club").toLowerCase() === kind);
    },
    [enrollments]
  );

  return {
    enrollments,
    loading,
    error,
    refetch: fetchEnrollments,
    filterByCategory,
    filterByTypeId,
    filterByKind,
  };
}
