import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { LessonDetail } from "@/hooks/useTeacherLessonPlans";

export interface StudentInfo {
  id: string;
  name: string;
  studentId: string;
  class: string;
}

export interface HomeworkSubmission {
  id: string;
  lessonPlanDetailId: string;
  classYearId: number;
  studentId: string;
  submitted: boolean;
  submittedAt: string | null;
  markedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonWithHomework {
  lesson: LessonDetail;
  topicTitle: string;
  weekNumber: number;
  weekTitle: string;
}

/**
 * Hook to fetch students for a given class
 */
export function useClassStudents(classYearId: number | undefined) {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          .select("id, name, student_id, class")
          .eq("class_year_id", classYearId)
          .order("name");

        if (fetchError) throw fetchError;

        const formattedStudents: StudentInfo[] = (data || []).map((s) => ({
          id: s.id,
          name: s.name,
          studentId: s.student_id || "",
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
  }, [classYearId]);

  return { students, loading, error };
}

/**
 * Hook to manage homework submissions for a lesson plan and class
 */
export function useHomeworkSubmissions(
  lessonPlanId: string | undefined,
  classYearId: number | undefined
) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Map<string, Map<string, HomeworkSubmission>>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch all submissions for lessons in this plan and class
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!lessonPlanId || !classYearId) {
        setSubmissions(new Map());
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
          setLoading(false);
          return;
        }

        const lessonIds = lessonsData.map((l) => l.id);

        // Fetch submissions for this class
        const { data: submissionsData, error } = await supabase
          .from("homework_submissions")
          .select("*")
          .in("lesson_plan_detail_id", lessonIds)
          .eq("class_year_id", classYearId);

        if (error) throw error;

        // Organize by lessonId -> studentId -> submission
        const submissionsMap = new Map<string, Map<string, HomeworkSubmission>>();
        (submissionsData || []).forEach((s: any) => {
          const lessonMap = submissionsMap.get(s.lesson_plan_detail_id) || new Map();
          lessonMap.set(s.student_id, {
            id: s.id,
            lessonPlanDetailId: s.lesson_plan_detail_id,
            classYearId: s.class_year_id,
            studentId: s.student_id,
            submitted: s.submitted,
            submittedAt: s.submitted_at,
            markedBy: s.marked_by,
            notes: s.notes,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          });
          submissionsMap.set(s.lesson_plan_detail_id, lessonMap);
        });

        setSubmissions(submissionsMap);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        toast({
          title: "Error",
          description: "Failed to load homework submissions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [lessonPlanId, classYearId]);

  // Toggle submission status for a student
  const toggleSubmission = useCallback(
    async (lessonPlanDetailId: string, studentId: string, currentStatus: boolean) => {
      if (!classYearId || !user?.id) {
        toast({
          title: "Error",
          description: "Please select a class first",
          variant: "destructive",
        });
        return false;
      }

      setSaving(true);

      try {
        const lessonSubmissions = submissions.get(lessonPlanDetailId);
        const existingSubmission = lessonSubmissions?.get(studentId);

        const newStatus = !currentStatus;
        const now = new Date().toISOString();

        if (existingSubmission) {
          // Update existing submission
          const { error } = await supabase
            .from("homework_submissions")
            .update({
              submitted: newStatus,
              submitted_at: newStatus ? now : null,
              marked_by: user.id,
              updated_at: now,
            })
            .eq("id", existingSubmission.id);

          if (error) throw error;

          // Update local state
          setSubmissions((prev) => {
            const next = new Map(prev);
            const lessonMap = new Map(next.get(lessonPlanDetailId) || []);
            lessonMap.set(studentId, {
              ...existingSubmission,
              submitted: newStatus,
              submittedAt: newStatus ? now : null,
              markedBy: user.id,
              updatedAt: now,
            });
            next.set(lessonPlanDetailId, lessonMap);
            return next;
          });
        } else {
          // Create new submission
          const { data, error } = await supabase
            .from("homework_submissions")
            .insert({
              lesson_plan_detail_id: lessonPlanDetailId,
              class_year_id: classYearId,
              student_id: studentId,
              submitted: newStatus,
              submitted_at: newStatus ? now : null,
              marked_by: user.id,
            })
            .select()
            .single();

          if (error) throw error;

          // Update local state
          setSubmissions((prev) => {
            const next = new Map(prev);
            const lessonMap = new Map(next.get(lessonPlanDetailId) || []);
            lessonMap.set(studentId, {
              id: data.id,
              lessonPlanDetailId: data.lesson_plan_detail_id,
              classYearId: data.class_year_id,
              studentId: data.student_id,
              submitted: data.submitted,
              submittedAt: data.submitted_at,
              markedBy: data.marked_by,
              notes: data.notes,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            });
            next.set(lessonPlanDetailId, lessonMap);
            return next;
          });
        }

        return true;
      } catch (err) {
        console.error("Error toggling submission:", err);
        toast({
          title: "Error",
          description: "Failed to update submission status",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [classYearId, user?.id, submissions]
  );

  // Get submission status for a student on a lesson
  const getSubmissionStatus = useCallback(
    (lessonPlanDetailId: string, studentId: string): boolean => {
      const lessonSubmissions = submissions.get(lessonPlanDetailId);
      if (!lessonSubmissions) return false;
      const submission = lessonSubmissions.get(studentId);
      return submission?.submitted || false;
    },
    [submissions]
  );

  // Get submission count for a lesson
  const getSubmissionCount = useCallback(
    (lessonPlanDetailId: string, totalStudents: number): { submitted: number; total: number } => {
      const lessonSubmissions = submissions.get(lessonPlanDetailId);
      if (!lessonSubmissions) return { submitted: 0, total: totalStudents };

      let submittedCount = 0;
      lessonSubmissions.forEach((s) => {
        if (s.submitted) submittedCount++;
      });

      return { submitted: submittedCount, total: totalStudents };
    },
    [submissions]
  );

  return {
    submissions,
    loading,
    saving,
    toggleSubmission,
    getSubmissionStatus,
    getSubmissionCount,
  };
}
