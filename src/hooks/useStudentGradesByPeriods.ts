import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useResumeTick } from "@/hooks/useRefreshOnAppResume";

export interface StudentGradeRow {
  id: string;
  student_id: string;
  subject_id: number;
  academic_period_id: string;
  total_marks: number | null;
  letter_grade: string | null;
  quiz_marks: number;
  homework_marks: number;
  exam_marks: number;
  attitude_marks: number;
}

interface UseStudentGradesByPeriodsArgs {
  studentId: string | null;
  subjectIds: number[];
  periodIds: string[];
}

interface UseStudentGradesByPeriodsResult {
  grades: StudentGradeRow[];
  loading: boolean;
  error: string | null;
}

export function useStudentGradesByPeriods(
  args: UseStudentGradesByPeriodsArgs
): UseStudentGradesByPeriodsResult {
  const { studentId, subjectIds, periodIds } = args;
  const [grades, setGrades] = useState<StudentGradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resumeTick = useResumeTick();

  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentId || subjectIds.length === 0 || periodIds.length === 0) {
        setGrades([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: gradesError } = await supabase
          .from("student_grades")
          .select(
            "id, student_id, subject_id, academic_period_id, total_marks, letter_grade, quiz_marks, homework_marks, exam_marks, attitude_marks"
          )
          .eq("student_id", studentId)
          .in("subject_id", subjectIds)
          .in("academic_period_id", periodIds);

        if (gradesError) {
          console.error("[useStudentGradesByPeriods] student_grades error:", {
            code: gradesError.code,
            message: gradesError.message,
            details: gradesError.details,
            hint: gradesError.hint,
          });
          throw gradesError;
        }

        setGrades(data || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load student grades.";
        setError(message);
        setGrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [
    studentId,
    subjectIds.join(","),
    periodIds.join(","),
    resumeTick,
  ]);

  return { grades, loading, error };
}
