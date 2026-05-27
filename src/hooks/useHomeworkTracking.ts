import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { LessonDetail } from "@/hooks/useTeacherLessonPlans";
import { useResumeTick } from "@/hooks/useRefreshOnAppResume";

export interface StudentInfo {
  id: string;
  name: string;
  studentId: string;
  class: string;
}

export interface HomeworkStudentRecord {
  id: string;
  homeworkId: string;
  studentId: string;
  status: string; // "assigned" | "submitted"
  submittedAt: string | null;
  markedBy: string | null;
  markedAt: string | null;
}

export interface LessonWithHomework {
  lesson: LessonDetail;
  topicTitle: string;
  weekNumber: number;
  weekTitle: string;
  homeworkAssignmentId: string;
}

/**
 * Hook to fetch students for a given class
 */
export function useClassStudents(classYearId: number | undefined) {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resumeTick = useResumeTick();

  useEffect(() => {
    const fetchStudents = async () => {
      if (!classYearId) {
        setStudents([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("students")
          .select("id, name, student_ic, class")
          .eq("class_year_id", classYearId)
          .order("name");

        if (fetchError) throw fetchError;

        const formattedStudents: StudentInfo[] = (data || []).map((s) => ({
          id: s.id,
          name: s.name,
          studentId: s.student_ic || "",
          class: s.class || "",
        }));

        setStudents(formattedStudents);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError(err instanceof Error ? err.message : "Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [classYearId, resumeTick]);

  return { students, loading, error };
}

/**
 * Hook to manage homework tracking via homework_assignment_students table
 */
export function useHomeworkSubmissions(
  lessonPlanId: string | undefined,
  classYearId: number | undefined
) {
  const { user } = useAuth();
  // Map: homeworkAssignmentId -> studentId -> record
  const [submissions, setSubmissions] = useState<Map<string, Map<string, HomeworkStudentRecord>>>(
    new Map()
  );
  // Map: lessonPlanDetailId -> homeworkAssignmentId
  const [assignmentMap, setAssignmentMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const resumeTick = useResumeTick();

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!lessonPlanId || !classYearId) {
        setSubmissions(new Map());
        setAssignmentMap(new Map());
        return;
      }

      setLoading(true);

      try {
        // Get all lesson_plan_detail_ids for this lesson_plan
        const { data: topicsData } = await supabase
          .from("lesson_topics")
          .select("id")
          .eq("lesson_plan_id", lessonPlanId);

        if (!topicsData || topicsData.length === 0) {
          setSubmissions(new Map());
          setAssignmentMap(new Map());
          setLoading(false);
          return;
        }

        const topicIds = topicsData.map((t) => t.id);

        const { data: weeksData } = await supabase
          .from("lesson_weeks")
          .select("id")
          .in("topic_id", topicIds);

        if (!weeksData || weeksData.length === 0) {
          setSubmissions(new Map());
          setAssignmentMap(new Map());
          setLoading(false);
          return;
        }

        const weekIds = weeksData.map((w) => w.id);

        const { data: lessonsData } = await supabase
          .from("lesson_plan_details")
          .select("id")
          .in("week_id", weekIds);

        if (!lessonsData || lessonsData.length === 0) {
          setSubmissions(new Map());
          setAssignmentMap(new Map());
          setLoading(false);
          return;
        }

        const lessonIds = lessonsData.map((l) => l.id);

        // Find homework_assignments for this class + these lessons
        const { data: assignments, error: assignErr } = await supabase
          .from("homework_assignments")
          .select("id, lesson_plan_detail_id")
          .in("lesson_plan_detail_id", lessonIds)
          .eq("class_year_id", classYearId);

        if (assignErr) throw assignErr;

        if (!assignments || assignments.length === 0) {
          setSubmissions(new Map());
          setAssignmentMap(new Map());
          setLoading(false);
          return;
        }

        // Build lessonDetailId -> assignmentId map
        const aMap = new Map<string, string>();
        const assignmentIds: string[] = [];
        assignments.forEach((a: any) => {
          aMap.set(a.lesson_plan_detail_id, a.id);
          assignmentIds.push(a.id);
        });
        setAssignmentMap(aMap);

        // Fetch student records
        const { data: studentRecords, error } = await supabase
          .from("homework_assignment_students")
          .select("*")
          .in("homework_id", assignmentIds);

        if (error) throw error;

        const submissionsMap = new Map<string, Map<string, HomeworkStudentRecord>>();
        (studentRecords || []).forEach((r: any) => {
          const hwMap = submissionsMap.get(r.homework_id) || new Map();
          hwMap.set(r.student_id, {
            id: r.id,
            homeworkId: r.homework_id,
            studentId: r.student_id,
            status: r.status,
            submittedAt: r.submitted_at,
            markedBy: r.marked_by,
            markedAt: r.marked_at,
          });
          submissionsMap.set(r.homework_id, hwMap);
        });

        setSubmissions(submissionsMap);
      } catch (err) {
        console.error("Error fetching homework tracking:", err);
        toast({
          title: "Error",
          description: "Failed to load homework tracking data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [lessonPlanId, classYearId, resumeTick]);

  // Toggle submission status for a student
  const toggleSubmission = useCallback(
    async (lessonPlanDetailId: string, studentId: string, currentStatus: boolean) => {
      if (!classYearId || !user?.id) {
        toast({ title: "Error", description: "Please select a class first", variant: "destructive" });
        return false;
      }

      const homeworkId = assignmentMap.get(lessonPlanDetailId);
      if (!homeworkId) {
        toast({ title: "Error", description: "No homework assignment found for this lesson", variant: "destructive" });
        return false;
      }

      setSaving(true);

      try {
        const hwSubmissions = submissions.get(homeworkId);
        const existing = hwSubmissions?.get(studentId);
        const newStatus = currentStatus ? "assigned" : "submitted";
        const now = new Date().toISOString();

        if (existing) {
          const { error } = await supabase
            .from("homework_assignment_students")
            .update({
              status: newStatus,
              submitted_at: newStatus === "submitted" ? now : null,
              marked_by: user.id,
              marked_at: now,
              updated_at: now,
            })
            .eq("id", existing.id);

          if (error) throw error;

          setSubmissions((prev) => {
            const next = new Map(prev);
            const hwMap = new Map(next.get(homeworkId) || []);
            hwMap.set(studentId, {
              ...existing,
              status: newStatus,
              submittedAt: newStatus === "submitted" ? now : null,
              markedBy: user.id,
              markedAt: now,
            });
            next.set(homeworkId, hwMap);
            return next;
          });
        } else {
          // Create new record (shouldn't normally happen since auto-created on assign)
          const { data, error } = await supabase
            .from("homework_assignment_students")
            .insert({
              homework_id: homeworkId,
              student_id: studentId,
              status: newStatus,
              submitted_at: newStatus === "submitted" ? now : null,
              marked_by: user.id,
              marked_at: now,
            })
            .select()
            .single();

          if (error) throw error;

          setSubmissions((prev) => {
            const next = new Map(prev);
            const hwMap = new Map(next.get(homeworkId) || []);
            hwMap.set(studentId, {
              id: data.id,
              homeworkId: data.homework_id,
              studentId: data.student_id,
              status: data.status,
              submittedAt: data.submitted_at,
              markedBy: data.marked_by,
              markedAt: data.marked_at,
            });
            next.set(homeworkId, hwMap);
            return next;
          });
        }

        return true;
      } catch (err) {
        console.error("Error toggling submission:", err);
        toast({ title: "Error", description: "Failed to update submission status", variant: "destructive" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [classYearId, user?.id, submissions, assignmentMap]
  );

  // Get submission status for a student on a lesson
  const getSubmissionStatus = useCallback(
    (lessonPlanDetailId: string, studentId: string): boolean => {
      const homeworkId = assignmentMap.get(lessonPlanDetailId);
      if (!homeworkId) return false;
      const hwSubs = submissions.get(homeworkId);
      if (!hwSubs) return false;
      const record = hwSubs.get(studentId);
      return record?.status === "submitted";
    },
    [submissions, assignmentMap]
  );

  // Get submission count for a lesson
  const getSubmissionCount = useCallback(
    (lessonPlanDetailId: string, totalStudents: number): { submitted: number; total: number } => {
      const homeworkId = assignmentMap.get(lessonPlanDetailId);
      if (!homeworkId) return { submitted: 0, total: totalStudents };
      const hwSubs = submissions.get(homeworkId);
      if (!hwSubs) return { submitted: 0, total: totalStudents };

      let submittedCount = 0;
      hwSubs.forEach((r) => {
        if (r.status === "submitted") submittedCount++;
      });

      return { submitted: submittedCount, total: totalStudents };
    },
    [submissions, assignmentMap]
  );

  return {
    submissions,
    assignmentMap,
    loading,
    saving,
    toggleSubmission,
    getSubmissionStatus,
    getSubmissionCount,
  };
}
