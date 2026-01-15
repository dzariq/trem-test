import { useEffect, useMemo, useState } from "react";
import { listMyLinkedStudents, type LinkedStudent } from "@/data/students";

const STORAGE_KEY = "selected_student_id";

const readStoredStudentId = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
};

export function useStudentSelection() {
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => readStoredStudentId());

  useEffect(() => {
    let isMounted = true;
    const loadStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listMyLinkedStudents();
        if (isMounted) {
          setLinkedStudents(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load linked students.";
        if (isMounted) {
          setError(message);
          setLinkedStudents([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStudents();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedStudentId) {
      localStorage.setItem(STORAGE_KEY, selectedStudentId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    if (linkedStudents.length === 0) {
      if (selectedStudentId) {
        setSelectedStudentId("");
      }
      return;
    }

    const selectionExists = linkedStudents.some((student) => student.id === selectedStudentId);
    if (!selectionExists) {
      setSelectedStudentId(linkedStudents[0].id);
    }
  }, [linkedStudents, selectedStudentId]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return linkedStudents.find((student) => student.id === selectedStudentId) ?? null;
  }, [linkedStudents, selectedStudentId]);

  return {
    linkedStudents,
    loading,
    error,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
  };
}
