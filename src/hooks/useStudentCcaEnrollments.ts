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
  meetingDay: string | null;
  meetingTime: string | null;
  location: string | null;
  publicDescription: string | null;
  enrollmentStatus: string;
  picTeachers: {
    fullName: string;
    departments: string[];
    isPrimary?: boolean;
    role?: string;
  }[];
}

interface UseStudentCcaEnrollmentsOptions {
  studentId: string | null;
}

/**
 * Hook to fetch CCA activities that a student is enrolled in.
 * Used in parent calendar to show "My CCAs (Enrolled)" section.
 */
export function useStudentCcaEnrollments({ studentId }: UseStudentCcaEnrollmentsOptions) {
  const [enrollments, setEnrollments] = useState<EnrolledCcaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    if (!studentId) {
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
          cca_activity_id,
          status,
          cca_activities(
            id,
            name,
            category,
            type_id,
            cca_activity_types(id, name),
            meeting_day,
            meeting_time,
            location,
            public_description,
            is_active
          )
        `)
        .eq("student_id", studentId)
        .in("status", ["enrolled", "active"]);

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

      // Collect unique teacher user IDs to fetch from v_teacher_public view
      const teacherUserIds = [
        ...new Set((teachersData || []).map((t: any) => t.teacher_user_id).filter(Boolean)),
      ];

      // Fetch teacher info from the public view (accessible to parents)
      let teacherProfilesMap: Record<string, { full_name: string; departments: string[] }> = {};
      if (teacherUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("v_teacher_public")
          .select("user_id, full_name, departments")
          .in("user_id", teacherUserIds);

        (profilesData || []).forEach((p: any) => {
          teacherProfilesMap[p.user_id] = {
            full_name: p.full_name || "Unknown",
            departments: Array.isArray(p.departments) ? p.departments : [],
          };
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

      // Map enrollments to our shape
      const mapped: EnrolledCcaActivity[] = (data || [])
        .filter((e: any) => e.cca_activities?.is_active !== false)
        .map((e: any) => ({
          id: e.cca_activities?.id || e.cca_activity_id,
          enrollmentId: e.id,
          activityId: e.cca_activity_id,
          name: e.cca_activities?.name || "Unknown Activity",
          category: e.cca_activities?.category || null,
          typeId: e.cca_activities?.type_id || null,
          typeName: e.cca_activities?.cca_activity_types?.name || null,
          meetingDay: e.cca_activities?.meeting_day || null,
          meetingTime: e.cca_activities?.meeting_time || null,
          location: e.cca_activities?.location || null,
          publicDescription: e.cca_activities?.public_description || null,
          enrollmentStatus: e.status,
          picTeachers: teachersByActivity[e.cca_activity_id] || [],
        }));

      setEnrollments(mapped);
    } catch (err: any) {
      console.error("[useStudentCcaEnrollments] error:", err);
      setError(err?.message || "Failed to load enrolled CCAs");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

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

  return {
    enrollments,
    loading,
    error,
    refetch: fetchEnrollments,
    filterByCategory,
    filterByTypeId,
  };
}
