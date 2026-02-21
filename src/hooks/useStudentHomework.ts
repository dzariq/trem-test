import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomeworkItem {
  id: string;
  assignmentId: string;
  title: string | null;
  instructions: string;
  dueDate: string | null;
  subject: string;
  status: "pending" | "submitted" | "late";
  submittedAt: string | null;
  lessonTitle: string | null;
  lessonDate: string | null;
}

export function useStudentHomework(studentId: string | null) {
  const homeworkQuery = useQuery({
    queryKey: ["student-homework", studentId],
    queryFn: async () => {
      if (!studentId) return [];

      // Phase 1: Query through homework_assignment_students → homework_assignments
      const { data, error } = await supabase
        .from("homework_assignment_students")
        .select(`
          id,
          status,
          submitted_at,
          homework_assignments!inner (
            id,
            title,
            instructions,
            due_date,
            subject,
            lesson_plan_detail_id
          )
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get lesson plan detail info for context
      const lessonDetailIds = (data || [])
        .map((r: any) => r.homework_assignments?.lesson_plan_detail_id)
        .filter(Boolean);

      let lessonDetailsMap: Record<string, { title: string; date: string | null }> = {};
      if (lessonDetailIds.length > 0) {
        const { data: lessonDetails } = await supabase
          .from("lesson_plan_details")
          .select("id, title, date")
          .in("id", lessonDetailIds);

        (lessonDetails || []).forEach((ld: any) => {
          lessonDetailsMap[ld.id] = { title: ld.title, date: ld.date };
        });
      }

      const items: HomeworkItem[] = (data || []).map((row: any) => {
        const hw = row.homework_assignments;
        const lessonDetail = hw.lesson_plan_detail_id
          ? lessonDetailsMap[hw.lesson_plan_detail_id]
          : null;

        // Determine status
        let status: "pending" | "submitted" | "late" = "pending";
        if (row.status === "submitted") {
          status = "submitted";
        } else if (hw.due_date && new Date(hw.due_date) < new Date()) {
          status = "late";
        }

        return {
          id: row.id,
          assignmentId: hw.id,
          title: hw.title || lessonDetail?.title || null,
          instructions: hw.instructions,
          dueDate: hw.due_date,
          subject: hw.subject || "Unknown",
          status,
          submittedAt: row.submitted_at,
          lessonTitle: lessonDetail?.title || null,
          lessonDate: lessonDetail?.date || null,
        };
      });

      return items;
    },
    enabled: !!studentId,
  });

  return {
    homework: homeworkQuery.data || [],
    isLoading: homeworkQuery.isLoading,
    error: homeworkQuery.error,
  };
}
