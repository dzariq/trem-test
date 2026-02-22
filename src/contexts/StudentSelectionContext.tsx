import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentIdState] = useState<string>(() => readStoredStudentId());

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyLinkedStudents();
      setLinkedStudents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load linked students.";
      setError(message);
      setLinkedStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch students after auth is initialized and user exists
  useEffect(() => {
    if (authLoading) return; // Still initializing auth — don't query yet
    if (!user) {
      // Auth done but no user — clear students, not an error
      setLinkedStudents([]);
      setLoading(false);
      return;
    }
    loadStudents();
  }, [authLoading, user, loadStudents]);

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
      // Invalidate all student-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: ["attendanceSummary"] });
      queryClient.invalidateQueries({ queryKey: ["studentReportCard"] });
      queryClient.invalidateQueries({ queryKey: ["studentGrades"] });
      queryClient.invalidateQueries({ queryKey: ["studentGradeGoals"] });
      queryClient.invalidateQueries({ queryKey: ["studentBehavior"] });
      queryClient.invalidateQueries({ queryKey: ["studentCocurricular"] });
      queryClient.invalidateQueries({ queryKey: ["gradeAnalysis"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingCcaSessions"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    }
  }, [selectedStudentId, queryClient]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return linkedStudents.find((student) => student.id === selectedStudentId) ?? null;
  }, [linkedStudents, selectedStudentId]);

  const refreshStudents = useCallback(async () => {
    await loadStudents();
  }, [loadStudents]);

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
