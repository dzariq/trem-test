import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export interface SessionStudent {
  id: string;
  name: string;
  class: string;
  yearLevel: string;
  isEnrolled: boolean;
  isEligible: boolean;
}

interface SessionEnrollmentInfo {
  enrolledCount: number;
  maxParticipants: number;
  isFull: boolean;
}

interface EligibilityInfo {
  eligibleYears: string[];
  activityName: string;
}

interface UseSessionEnrollmentOptions {
  sessionId: string | null;
  activityId: string | null;
}

/**
 * Hook for managing student enrollment in CCA sessions.
 * Teachers can enroll/unenroll students they are assigned to.
 * Enforces year-level eligibility based on cca_club_year_eligibility table.
 */
export function useSessionEnrollment({ sessionId, activityId }: UseSessionEnrollmentOptions) {
  const [students, setStudents] = useState<SessionStudent[]>([]);
  const [enrollmentInfo, setEnrollmentInfo] = useState<SessionEnrollmentInfo>({
    enrolledCount: 0,
    maxParticipants: 25,
    isFull: false,
  });
  const [eligibilityInfo, setEligibilityInfo] = useState<EligibilityInfo>({
    eligibleYears: [],
    activityName: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch students that the teacher is assigned to along with their enrollment status
   * and check eligibility based on club's year requirements
   */
  const fetchStudents = useCallback(async () => {
    if (!sessionId || !activityId) return;

    setLoading(true);
    setError(null);

    try {
      // Get current user's assigned class_year_ids
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Not authenticated");

      const teacherUserId = userData.user.id;

      // Fetch in parallel: teacher assignments, activity info, eligible years
      const [assignmentsResult, activityResult, eligibilityResult] = await Promise.all([
        supabase
          .from("teacher_assignments")
          .select("class_year_id")
          .eq("teacher_id", teacherUserId),
        supabase
          .from("cca_activities")
          .select("id, name")
          .eq("id", activityId)
          .single(),
        supabase
          .from("cca_club_year_eligibility")
          .select("year_code")
          .eq("club_id", activityId),
      ]);

      if (assignmentsResult.error) throw assignmentsResult.error;

      // Store activity name and eligible years
      const activityName = activityResult.data?.name || "";
      const eligibleYears = (eligibilityResult.data || []).map((e) => e.year_code).sort();
      
      setEligibilityInfo({
        eligibleYears,
        activityName,
      });

      const classYearIds = (assignmentsResult.data || []).map((a) => a.class_year_id);

      if (classYearIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Get class names for these class_year_ids
      const { data: classYears, error: classError } = await supabase
        .from("class_years")
        .select("id, class_name")
        .in("id", classYearIds);

      if (classError) throw classError;

      const classNames = (classYears || []).map((c) => c.class_name);

      if (classNames.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Get students and enrollments in parallel
      const [studentsResult, enrollmentsResult, sessionResult] = await Promise.all([
        supabase
          .from("students")
          .select("id, name, class, year_level")
          .in("class", classNames)
          .eq("archived", false)
          .order("name"),
        supabase
          .from("cca_session_enrollments")
          .select("student_id")
          .eq("session_id", sessionId)
          .eq("status", "enrolled"),
        supabase
          .from("cca_sessions")
          .select("max_participants")
          .eq("id", sessionId)
          .single(),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (enrollmentsResult.error) throw enrollmentsResult.error;

      const enrolledStudentIds = new Set((enrollmentsResult.data || []).map((e) => e.student_id));
      const maxParticipants = sessionResult.data?.max_participants || 25;
      const enrolledCount = enrolledStudentIds.size;

      setEnrollmentInfo({
        enrolledCount,
        maxParticipants,
        isFull: enrolledCount >= maxParticipants,
      });

      // Helper to check if student year is eligible
      const isYearEligible = (studentYear: string | null): boolean => {
        // If no eligibility restrictions, everyone is eligible
        if (eligibleYears.length === 0) return true;
        if (!studentYear) return false;
        // Normalize year format (e.g., "y2" -> "Y2")
        const normalizedYear = studentYear.toUpperCase().trim();
        return eligibleYears.includes(normalizedYear);
      };

      // Map students with enrollment status and eligibility
      const mapped: SessionStudent[] = (studentsResult.data || []).map((s: any) => ({
        id: s.id,
        name: s.name || "Unknown",
        class: s.class || "",
        yearLevel: s.year_level || "",
        isEnrolled: enrolledStudentIds.has(s.id),
        isEligible: isYearEligible(s.year_level),
      }));

      setStudents(mapped);
    } catch (err: any) {
      console.error("[useSessionEnrollment] fetchStudents error:", err);
      setError(err?.message || "Failed to load students");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, activityId]);

  /**
   * Check if a student is eligible for this activity
   */
  const checkStudentEligibility = useCallback(
    (studentYearLevel: string | null): { eligible: boolean; message: string | null } => {
      const { eligibleYears, activityName } = eligibilityInfo;
      
      // If no eligibility restrictions, everyone is eligible
      if (eligibleYears.length === 0) {
        return { eligible: true, message: null };
      }
      
      if (!studentYearLevel) {
        return { 
          eligible: false, 
          message: `Cannot enroll: ${activityName || "This club"} requires a valid year level.`
        };
      }
      
      const normalizedYear = studentYearLevel.toUpperCase().trim();
      if (!eligibleYears.includes(normalizedYear)) {
        const yearsDisplay = eligibleYears.join(", ");
        return {
          eligible: false,
          message: `Cannot enroll: ${activityName || "This club"} is only available for ${yearsDisplay}.`
        };
      }
      
      return { eligible: true, message: null };
    },
    [eligibilityInfo]
  );

  /**
   * Enroll a student in the session (with eligibility and capacity checks)
   */
  const enrollStudent = useCallback(
    async (studentId: string, studentYearLevel: string): Promise<boolean> => {
      if (!sessionId) {
        toast({ title: "Error", description: "No session selected", variant: "destructive" });
        return false;
      }

      // Check eligibility first (UI guard)
      const eligibility = checkStudentEligibility(studentYearLevel);
      if (!eligibility.eligible) {
        toast({
          title: "Not Eligible",
          description: eligibility.message || "Student is not eligible for this activity",
          variant: "destructive",
        });
        return false;
      }

      setSaving(true);
      try {
        // Check if session is full
        const { data: isFull } = await supabase.rpc("is_cca_session_full", { p_session_id: sessionId });

        if (isFull) {
          toast({
            title: "Session Full",
            description: "This session has reached maximum capacity",
            variant: "destructive",
          });
          return false;
        }

        const { error: insertError } = await supabase.from("cca_session_enrollments").insert({
          session_id: sessionId,
          student_id: studentId,
          enrolled_by: (await supabase.auth.getUser()).data.user?.id,
          status: "enrolled",
        });

        if (insertError) {
          // Handle backend eligibility enforcement errors
          if (insertError.message.includes("not eligible") || insertError.message.includes("only available for")) {
            toast({
              title: "Not Eligible",
              description: insertError.message,
              variant: "destructive",
            });
          } else if (insertError.message.includes("duplicate")) {
            toast({
              title: "Already Enrolled",
              description: "This student is already enrolled in this session",
              variant: "destructive",
            });
          } else if (insertError.message.includes("row-level security")) {
            toast({
              title: "Permission Denied",
              description: "You don't have permission to enroll students in this session",
              variant: "destructive",
            });
          } else {
            toast({ title: "Error", description: insertError.message, variant: "destructive" });
          }
          return false;
        }

        toast({ title: "Success", description: "Student enrolled successfully" });
        await fetchStudents();
        return true;
      } catch (err: any) {
        console.error("[useSessionEnrollment] enrollStudent error:", err);
        toast({ title: "Error", description: err?.message || "Failed to enroll student", variant: "destructive" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [sessionId, fetchStudents, checkStudentEligibility]
  );

  /**
   * Unenroll a student from the session
   */
  const unenrollStudent = useCallback(
    async (studentId: string): Promise<boolean> => {
      if (!sessionId) {
        toast({ title: "Error", description: "No session selected", variant: "destructive" });
        return false;
      }

      setSaving(true);
      try {
        const { error: deleteError } = await supabase
          .from("cca_session_enrollments")
          .delete()
          .eq("session_id", sessionId)
          .eq("student_id", studentId);

        if (deleteError) {
          if (deleteError.message.includes("row-level security")) {
            toast({
              title: "Permission Denied",
              description: "You don't have permission to unenroll students from this session",
              variant: "destructive",
            });
          } else {
            toast({ title: "Error", description: deleteError.message, variant: "destructive" });
          }
          return false;
        }

        toast({ title: "Success", description: "Student unenrolled successfully" });
        await fetchStudents();
        return true;
      } catch (err: any) {
        console.error("[useSessionEnrollment] unenrollStudent error:", err);
        toast({ title: "Error", description: err?.message || "Failed to unenroll student", variant: "destructive" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [sessionId, fetchStudents]
  );

  /**
   * Filter students by search query and class
   */
  const filterStudents = useCallback(
    (searchQuery: string, classFilter: string) => {
      let filtered = students;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((s) => s.name.toLowerCase().includes(query));
      }

      if (classFilter && classFilter !== "all") {
        filtered = filtered.filter((s) => s.class === classFilter);
      }

      return filtered;
    },
    [students]
  );

  /**
   * Get unique classes from students
   */
  const availableClasses = useMemo(() => {
    const classes = new Set(students.map((s) => s.class).filter(Boolean));
    return Array.from(classes).sort();
  }, [students]);

  return {
    students,
    enrollmentInfo,
    eligibilityInfo,
    loading,
    saving,
    error,
    fetchStudents,
    enrollStudent,
    unenrollStudent,
    filterStudents,
    availableClasses,
    checkStudentEligibility,
  };
}
