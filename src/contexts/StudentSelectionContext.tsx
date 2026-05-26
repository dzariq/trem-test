import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyLinkedStudents, type LinkedStudent } from "@/data/students";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "selected_student_id";

const readStoredStudentId = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
};

type StudentSelectionContextType = {
  linkedStudents: LinkedStudent[];
  loading: boolean;
  error: string | null;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  selectedStudent: LinkedStudent | null;
  refreshStudents: () => Promise<void>;
};

const StudentSelectionContext = createContext<StudentSelectionContextType | undefined>(undefined);

export function StudentSelectionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { loading: authLoading, user } = useAuth();
  const [selectedStudentId, setSelectedStudentIdState] = useState<string>(() => readStoredStudentId());

  const {
    data: linkedStudents = [],
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["linked-students", user?.id],
    queryFn: () => listMyLinkedStudents(),
    enabled: !authLoading && !!user,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  // While auth is initializing, treat as loading so consumers don't render an empty state.
  const loading = authLoading || (!!user && (isLoading || isFetching));
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to load linked students.") : null;

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedStudentId) {
      localStorage.setItem(STORAGE_KEY, selectedStudentId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedStudentId]);

  // Auto-select first student if none selected or selection invalid
  useEffect(() => {
    if (linkedStudents.length === 0) {
      if (selectedStudentId) {
        setSelectedStudentIdState("");
      }
      return;
    }

    const selectionExists = linkedStudents.some((student) => student.id === selectedStudentId);
    if (!selectionExists) {
      setSelectedStudentIdState(linkedStudents[0].id);
    }
  }, [linkedStudents, selectedStudentId]);

  // The setter that also invalidates React Query caches
  const setSelectedStudentId = useCallback((id: string) => {
    const previousId = selectedStudentId;
    setSelectedStudentIdState(id);

    // Only invalidate if the ID actually changed
    if (id && id !== previousId) {
      // Invalidate only student-scoped queries. notifications/calendarEvents
      // are not keyed by student and were being needlessly refetched.
      queryClient.invalidateQueries({ queryKey: ["attendanceSummary"] });
      queryClient.invalidateQueries({ queryKey: ["studentReportCard"] });
      queryClient.invalidateQueries({ queryKey: ["studentGrades"] });
      queryClient.invalidateQueries({ queryKey: ["studentGradeGoals"] });
      queryClient.invalidateQueries({ queryKey: ["studentBehavior"] });
      queryClient.invalidateQueries({ queryKey: ["studentCocurricular"] });
      queryClient.invalidateQueries({ queryKey: ["gradeAnalysis"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingCcaSessions"] });
    }
  }, [selectedStudentId, queryClient]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return linkedStudents.find((student) => student.id === selectedStudentId) ?? null;
  }, [linkedStudents, selectedStudentId]);

  const refreshStudents = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <StudentSelectionContext.Provider
      value={{
        linkedStudents,
        loading,
        error,
        selectedStudentId,
        setSelectedStudentId,
        selectedStudent,
        refreshStudents,
      }}
    >
      {children}
    </StudentSelectionContext.Provider>
  );
}

export function useStudentSelection() {
  const context = useContext(StudentSelectionContext);
  if (context === undefined) {
    throw new Error("useStudentSelection must be used within a StudentSelectionProvider");
  }
  return context;
}
