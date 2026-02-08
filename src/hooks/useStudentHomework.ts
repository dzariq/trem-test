import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomeworkItem {
  id: string;
  title: string;
  homework: string;
  date: string | null;
  subject: string;
  className: string;
  yearLevel: string | null;
}

export function useStudentHomework(studentId: string | null) {
  // First get the student's class
  const { data: student } = useQuery({
    queryKey: ["student-class", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from("students")
        .select("class, year_level")
        .eq("id", studentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Then fetch homework for that class
  const homeworkQuery = useQuery({
    queryKey: ["student-homework", student?.class, student?.year_level],
    queryFn: async () => {
      if (!student?.class) return [];

      // Query lesson_plan_details with homework through the joins
      const { data, error } = await supabase
        .from("lesson_plan_details")
        .select(`
          id,
          title,
          homework,
          date,
          lesson_weeks!inner (
            id,
            lesson_topics!inner (
              id,
              lesson_plans!inner (
                subject,
                class,
                year_level
              )
            )
          )
        `)
        .not("homework", "is", null)
        .neq("homework", "")
        .order("date", { ascending: false });

      if (error) throw error;

      // Filter by class and transform the data
      const homework: HomeworkItem[] = (data || [])
        .filter((item: any) => {
          const lessonPlan = item.lesson_weeks?.lesson_topics?.lesson_plans;
          return lessonPlan?.class === student.class;
        })
        .map((item: any) => {
          const lessonPlan = item.lesson_weeks?.lesson_topics?.lesson_plans;
          return {
            id: item.id,
            title: item.title,
            homework: item.homework,
            date: item.date,
            subject: lessonPlan?.subject || "Unknown",
            className: lessonPlan?.class || "",
            yearLevel: lessonPlan?.year_level,
          };
        });

      return homework;
    },
    enabled: !!student?.class,
  });

  return {
    homework: homeworkQuery.data || [],
    isLoading: homeworkQuery.isLoading,
    error: homeworkQuery.error,
    studentClass: student?.class,
  };
}
