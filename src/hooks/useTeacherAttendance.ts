import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  fetchStudentsByClass,
  fetchAttendanceForClassDate,
  fetchAvailableClasses,
  saveAttendance,
  type AttendanceStatus,
  type StudentForAttendance,
  type AttendanceRecord,
} from "@/data/teacherAttendance";

export type StudentAttendanceState = {
  student_id: string;
  student_name: string;
  status: AttendanceStatus | null;
  remarks: string;
};

export function useTeacherAttendance() {
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<StudentForAttendance[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, StudentAttendanceState>>({});
  
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date for Supabase (YYYY-MM-DD)
  const dateString = format(selectedDate, "yyyy-MM-dd");

  // Load available classes on mount
  useEffect(() => {
    let mounted = true;
    const loadClasses = async () => {
      try {
        setLoadingClasses(true);
        setError(null);
        const classList = await fetchAvailableClasses();
        if (mounted) {
          setClasses(classList);
          if (classList.length > 0 && !selectedClass) {
            setSelectedClass(classList[0]);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load classes");
        }
      } finally {
        if (mounted) {
          setLoadingClasses(false);
        }
      }
    };
    loadClasses();
    return () => { mounted = false; };
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setAttendanceState({});
      return;
    }

    let mounted = true;
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        setError(null);
        const studentList = await fetchStudentsByClass(selectedClass);
        if (mounted) {
          setStudents(studentList);
          // Initialize attendance state for each student
          const initialState: Record<string, StudentAttendanceState> = {};
          studentList.forEach((s) => {
            initialState[s.id] = {
              student_id: s.id,
              student_name: s.name,
              status: null,
              remarks: "",
            };
          });
          setAttendanceState(initialState);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load students");
        }
      } finally {
        if (mounted) {
          setLoadingStudents(false);
        }
      }
    };
    loadStudents();
    return () => { mounted = false; };
  }, [selectedClass]);

  // Load existing attendance when class or date changes
  useEffect(() => {
    if (!selectedClass || students.length === 0) return;

    let mounted = true;
    const loadAttendance = async () => {
      try {
        setLoadingAttendance(true);
        setError(null);
        const records = await fetchAttendanceForClassDate(selectedClass, dateString);
        if (mounted) {
          // Map records by student_id
          const recordMap = new Map<string, AttendanceRecord>();
          records.forEach((r) => recordMap.set(r.student_id, r));

          // Update attendance state with existing records
          setAttendanceState((prev) => {
            const updated: Record<string, StudentAttendanceState> = {};
            students.forEach((s) => {
              const existing = recordMap.get(s.id);
              updated[s.id] = {
                student_id: s.id,
                student_name: s.name,
                status: existing?.status ?? null,
                remarks: existing?.remarks ?? "",
              };
            });
            return updated;
          });
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load attendance");
        }
      } finally {
        if (mounted) {
          setLoadingAttendance(false);
        }
      }
    };
    loadAttendance();
    return () => { mounted = false; };
  }, [selectedClass, dateString, students]);

  // Update status for a student
  const setStudentStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  }, []);

  // Update remarks for a student
  const setStudentRemarks = useCallback((studentId: string, remarks: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  }, []);

  // Save attendance
  const save = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!selectedClass) {
      return { success: false, message: "No class selected" };
    }

    // Check if all students have a status
    const unmarked = students.filter((s) => !attendanceState[s.id]?.status);
    if (unmarked.length > 0) {
      return {
        success: false,
        message: `${unmarked.length} student(s) haven't been marked yet.`,
      };
    }

    try {
      setSaving(true);
      setError(null);

      const records = students
        .filter((s) => attendanceState[s.id]?.status)
        .map((s) => ({
          student_id: s.id,
          student_name: attendanceState[s.id].student_name,
          status: attendanceState[s.id].status!,
          remarks: attendanceState[s.id].remarks || undefined,
        }));

      await saveAttendance(selectedClass, dateString, records);

      return {
        success: true,
        message: `Attendance for Class ${selectedClass} on ${format(selectedDate, "PPP")} has been saved.`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save attendance";
      setError(message);
      return { success: false, message };
    } finally {
      setSaving(false);
    }
  }, [selectedClass, dateString, selectedDate, students, attendanceState]);

  // Calculate summary counts
  const summary = {
    present: Object.values(attendanceState).filter((s) => s.status === "present").length,
    absent: Object.values(attendanceState).filter((s) => s.status === "absent").length,
    late: Object.values(attendanceState).filter((s) => s.status === "late").length,
    excused: Object.values(attendanceState).filter((s) => s.status === "excused").length,
    unmarked: Object.values(attendanceState).filter((s) => !s.status).length,
  };

  return {
    // State
    classes,
    selectedClass,
    setSelectedClass,
    selectedDate,
    setSelectedDate,
    students,
    attendanceState,
    summary,
    
    // Loading states
    loadingClasses,
    loadingStudents,
    loadingAttendance,
    saving,
    isLoading: loadingClasses || loadingStudents || loadingAttendance,
    
    // Error
    error,
    
    // Actions
    setStudentStatus,
    setStudentRemarks,
    save,
  };
}
