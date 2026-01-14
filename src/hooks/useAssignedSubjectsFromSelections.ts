import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AssignedSubject {
  id: number;
  name: string;
}

interface UseAssignedSubjectsResult {
  subjects: AssignedSubject[];
  assignedSubjectIds: number[];
  loading: boolean;
  error: string | null;
}

export function useAssignedSubjectsFromSelections(
  studentId: string | null
): UseAssignedSubjectsResult {
  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSelections = async () => {
      if (!studentId) {
        setSubjects([]);
        setAssignedSubjectIds([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: selectionsError } = await supabase
          .from("subject_selections")
          .select("subjects")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (selectionsError) {
          if (selectionsError.code === "PGRST116") {
            setSubjects([]);
            setAssignedSubjectIds([]);
            return;
          }
          console.error("[useAssignedSubjectsFromSelections] subject_selections error:", {
            code: selectionsError.code,
            message: selectionsError.message,
            details: selectionsError.details,
            hint: selectionsError.hint,
          });
          throw selectionsError;
        }

        const rawSubjects = Array.isArray(data?.subjects) ? data.subjects : [];
        const ids = Array.from(
          new Set(
            rawSubjects
              .map((subject: any) => Number(subject?.id))
              .filter(Number.isFinite)
          )
        );

        const mappedSubjects: AssignedSubject[] = rawSubjects
          .map((subject: any) => {
            const id = Number(subject?.id);
            if (!Number.isFinite(id)) return null;
            return {
              id,
              name: String(subject?.name ?? `Subject ${id}`),
            };
          })
          .filter((subject): subject is AssignedSubject => subject !== null);

        setSubjects(mappedSubjects);
        setAssignedSubjectIds(ids);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load subject selections.";
        setError(message);
        setSubjects([]);
        setAssignedSubjectIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSelections();
  }, [studentId]);

  return { subjects, assignedSubjectIds, loading, error };
}
