import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ClassAnalysisRosterStudent {
  id: string;
  name: string;
  class: string;
  year_level: string | null;
}

export interface ClassAnalysisGradeRow {
  student_id: string;
  subject_id: number;
  exam_period_id: string;
  academic_year: number | null;
  score_percent: number;
}

export interface UseClassAnalysisDataArgs {
  classId: string | null;
  examPeriodIds?: string[];
  subjectIds?: number[];
  studentId?: string | null;
  yearRange?: { start: number; end: number } | null;
}

interface UseClassAnalysisDataResult {
  rosterStudents: ClassAnalysisRosterStudent[];
  gradeRows: ClassAnalysisGradeRow[];
  loading: boolean;
  error: string | null;
}

const resolveScorePercent = (row: {
  total_marks: number | null;
  attitude_marks: number | null;
  homework_marks: number | null;
  quiz_marks: number | null;
  exam_marks: number | null;
}) => {
  if (Number.isFinite(row.total_marks)) {
    return row.total_marks as number;
  }
  const parts = [
    row.attitude_marks,
    row.homework_marks,
    row.quiz_marks,
    row.exam_marks,
  ];
  const hasParts = parts.some((value) => Number.isFinite(value));
  if (!hasParts) return null;
  return parts.reduce(
    (sum, value) => sum + (Number.isFinite(value) ? (value as number) : 0),
    0
  );
};

export function useClassAnalysisData(
  args: UseClassAnalysisDataArgs
): UseClassAnalysisDataResult {
  const {
    classId,
    examPeriodIds = [],
    subjectIds = [],
    studentId = null,
    yearRange = null,
  } = args;
  const [rosterStudents, setRosterStudents] = useState<
    ClassAnalysisRosterStudent[]
  >([]);
  const [gradeRows, setGradeRows] = useState<ClassAnalysisGradeRow[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rosterStudentIds = useMemo(
    () => rosterStudents.map((student) => student.id),
    [rosterStudents]
  );

  useEffect(() => {
    let isMounted = true;
    const loadRoster = async () => {
      if (!classId) {
        setRosterStudents([]);
        return;
      }
      setLoadingRoster(true);
      setError(null);
      try {
        const { data, error: rosterError } = await supabase
          .from("students")
          .select("id, name, class, year_level")
          .eq("class", classId)
          .eq("archived", false)
          .order("name");

        if (rosterError) {
          console.error("[useClassAnalysisData] roster error:", rosterError);
          throw rosterError;
        }

        if (isMounted) {
          setRosterStudents(data || []);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Failed to load class roster.";
          setError(message);
          setRosterStudents([]);
        }
      } finally {
        if (isMounted) {
          setLoadingRoster(false);
        }
      }
    };

    loadRoster();
    return () => {
      isMounted = false;
    };
  }, [classId]);

  useEffect(() => {
    let isMounted = true;
    const loadGrades = async () => {
      if (!classId || rosterStudentIds.length === 0) {
        setGradeRows([]);
        return;
      }
      setLoadingGrades(true);
      setError(null);
      try {
        let resolvedPeriodIds = examPeriodIds;
        if (resolvedPeriodIds.length === 0 && yearRange) {
          const { data: periods, error: periodError } = await supabase
            .from("academic_periods")
            .select("id, academic_year")
            .eq("is_active", true);

          if (periodError) {
            console.error(
              "[useClassAnalysisData] academic_periods error:",
              periodError
            );
            throw periodError;
          }

          resolvedPeriodIds =
            periods
              ?.filter((period) => {
                if (!Number.isFinite(period.academic_year)) return false;
                return (
                  period.academic_year >= yearRange.start &&
                  period.academic_year <= yearRange.end
                );
              })
              .map((period) => period.id) || [];
        }

        let query = supabase
          .from("student_grades")
          .select(
            "student_id, subject_id, academic_period_id, total_marks, attitude_marks, homework_marks, quiz_marks, exam_marks, academic_periods:academic_period_id(id, academic_year, name, code)"
          )
          .in("student_id", rosterStudentIds);

        if (studentId) {
          query = query.eq("student_id", studentId);
        }

        if (subjectIds.length > 0) {
          query = query.in("subject_id", subjectIds);
        }

        if (resolvedPeriodIds.length > 0) {
          query = query.in("academic_period_id", resolvedPeriodIds);
        }

        const { data, error: gradesError } = await query;

        if (gradesError) {
          console.error("[useClassAnalysisData] student_grades error:", {
            code: gradesError.code,
            message: gradesError.message,
            details: gradesError.details,
            hint: gradesError.hint,
          });
          throw gradesError;
        }

        const normalized =
          data
            ?.map((row) => {
              const score = resolveScorePercent(row);
              if (!Number.isFinite(score)) {
                return null;
              }
              return {
                student_id: row.student_id,
                subject_id: row.subject_id,
                exam_period_id: row.academic_period_id,
                academic_year: row.academic_periods?.academic_year ?? null,
                score_percent: score as number,
              };
            })
            .filter(
              (row): row is ClassAnalysisGradeRow => row !== null
            ) || [];

        if (isMounted) {
          setGradeRows(normalized);
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : "Failed to load class grades.";
          setError(message);
          setGradeRows([]);
        }
      } finally {
        if (isMounted) {
          setLoadingGrades(false);
        }
      }
    };

    loadGrades();
    return () => {
      isMounted = false;
    };
  }, [
    classId,
    rosterStudentIds.join(","),
    examPeriodIds.join(","),
    subjectIds.join(","),
    studentId,
    yearRange?.start,
    yearRange?.end,
  ]);

  return {
    rosterStudents,
    gradeRows,
    loading: loadingRoster || loadingGrades,
    error,
  };
}
