import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchAvailableClasses,
  fetchStudentsByClass,
  fetchSubjects,
  fetchAcademicPeriods,
  fetchExistingGrades,
  saveGrades,
  fetchClassRecommendation,
  saveClassRecommendation,
  GradeEntryStudent,
  SubjectInfo,
  AcademicPeriod,
  StudentGradeRecord,
  GradeInput,
  calculateLetterGrade,
} from "@/data/gradeEntry";

interface UseGradeEntryReturn {
  // Data
  classes: string[];
  students: GradeEntryStudent[];
  subjects: SubjectInfo[];
  academicPeriods: AcademicPeriod[];
  existingGrades: Map<string, StudentGradeRecord>;
  gradeInputs: Record<string, GradeInput>;
  classRecommendation: string;
  
  // Selection state
  selectedClass: string | null;
  selectedSubject: SubjectInfo | null;
  selectedPeriod: AcademicPeriod | null;
  
  // Loading/error states
  loadingClasses: boolean;
  loadingStudents: boolean;
  loadingSubjects: boolean;
  loadingGrades: boolean;
  saving: boolean;
  error: string | null;
  
  // Actions
  setSelectedClass: (className: string | null) => void;
  setSelectedSubject: (subject: SubjectInfo | null) => void;
  setSelectedPeriod: (period: AcademicPeriod | null) => void;
  updateGradeInput: (studentId: string, field: keyof GradeInput, value: string) => void;
  setClassRecommendation: (recommendation: string) => void;
  applyClassRecommendationToAll: () => void;
  save: () => Promise<{ success: boolean; error?: string }>;
  
  // Computed stats
  stats: {
    graded: number;
    pending: number;
    total: number;
    average: number;
  };
  
  // CSV helpers
  generateTemplate: () => string;
  exportGrades: () => string;
}

const emptyGradeInput: GradeInput = {
  attitude: "",
  homework: "",
  quiz: "",
  exam: "",
  reportComment: "",
  studyRecommendation: "",
  comment: "",
};

export function useGradeEntry(): UseGradeEntryReturn {
  // Selection state
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  
  // Data state
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<GradeEntryStudent[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [existingGrades, setExistingGrades] = useState<Map<string, StudentGradeRecord>>(new Map());
  const [gradeInputs, setGradeInputs] = useState<Record<string, GradeInput>>({});
  const [classRecommendation, setClassRecommendationState] = useState<string>("");
  
  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      setError(null);
      try {
        const fetchedClasses = await fetchAvailableClasses();
        setClasses(fetchedClasses);
      } catch (err) {
        setError("Failed to load classes");
        console.error(err);
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  // Load academic periods on mount
  useEffect(() => {
    const loadPeriods = async () => {
      try {
        const periods = await fetchAcademicPeriods();
        setAcademicPeriods(periods);
        // Auto-select first open period
        const openPeriod = periods.find(p => p.is_open_for_grading) || periods[0];
        if (openPeriod) {
          setSelectedPeriod(openPeriod);
        }
      } catch (err) {
        console.error("Failed to load academic periods:", err);
      }
    };
    loadPeriods();
  }, []);

  // Load students and subjects when class changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setSubjects([]);
      setSelectedSubject(null);
      return;
    }

    const loadStudentsAndSubjects = async () => {
      setLoadingStudents(true);
      setLoadingSubjects(true);
      setError(null);
      
      try {
        const fetchedStudents = await fetchStudentsByClass(selectedClass);
        setStudents(fetchedStudents);
        
        // Get year level from first student
        const yearLevel = fetchedStudents[0]?.year_level;
        const fetchedSubjects = await fetchSubjects(yearLevel);
        setSubjects(fetchedSubjects);
      } catch (err) {
        setError("Failed to load students or subjects");
        console.error(err);
      } finally {
        setLoadingStudents(false);
        setLoadingSubjects(false);
      }
    };

    loadStudentsAndSubjects();
  }, [selectedClass]);

  // Load existing grades when class, subject, or period changes
  useEffect(() => {
    if (!selectedClass || !selectedSubject || !selectedPeriod || students.length === 0) {
      setExistingGrades(new Map());
      setGradeInputs({});
      setClassRecommendationState("");
      return;
    }

    const loadGrades = async () => {
      setLoadingGrades(true);
      setError(null);
      
      try {
        const studentIds = students.map(s => s.id);
        const grades = await fetchExistingGrades(
          studentIds,
          selectedSubject.id,
          selectedPeriod.id
        );
        setExistingGrades(grades);

        // Initialize grade inputs from existing grades
        const inputs: Record<string, GradeInput> = {};
        students.forEach(student => {
          const existing = grades.get(student.id);
          if (existing) {
            inputs[student.id] = {
              attitude: existing.attitude_marks?.toString() || "",
              homework: existing.homework_marks?.toString() || "",
              quiz: existing.quiz_marks?.toString() || "",
              exam: existing.exam_marks?.toString() || "",
              reportComment: existing.subject_comment || "",
              studyRecommendation: "",
              comment: existing.teacher_comment || "",
            };
          } else {
            inputs[student.id] = { ...emptyGradeInput };
          }
        });
        setGradeInputs(inputs);

        // Load class recommendation
        const yearLevel = students[0]?.year_level || "";
        const recommendation = await fetchClassRecommendation(
          selectedClass,
          yearLevel,
          selectedSubject.id,
          selectedPeriod.id
        );
        setClassRecommendationState(recommendation || "");
      } catch (err) {
        setError("Failed to load existing grades");
        console.error(err);
      } finally {
        setLoadingGrades(false);
      }
    };

    loadGrades();
  }, [selectedClass, selectedSubject, selectedPeriod, students]);

  // Update grade input
  const updateGradeInput = useCallback((studentId: string, field: keyof GradeInput, value: string) => {
    setGradeInputs(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || emptyGradeInput),
        [field]: value
      }
    }));
  }, []);

  // Set class recommendation
  const setClassRecommendation = useCallback((recommendation: string) => {
    setClassRecommendationState(recommendation);
  }, []);

  // Apply class recommendation to all students
  const applyClassRecommendationToAll = useCallback(() => {
    setGradeInputs(prev => {
      const updated = { ...prev };
      students.forEach(student => {
        updated[student.id] = {
          ...(updated[student.id] || emptyGradeInput),
          studyRecommendation: classRecommendation
        };
      });
      return updated;
    });
  }, [students, classRecommendation]);

  // Save grades
  const save = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!selectedSubject || !selectedPeriod || !selectedClass) {
      return { success: false, error: "Please select class, subject, and period" };
    }

    setSaving(true);
    setError(null);

    try {
      // Prepare grades for save
      const gradesToSave = students.map(student => ({
        studentId: student.id,
        subjectId: selectedSubject.id,
        academicPeriodId: selectedPeriod.id,
        existingGradeId: existingGrades.get(student.id)?.id,
        gradeInput: gradeInputs[student.id] || emptyGradeInput
      }));

      const result = await saveGrades(gradesToSave);

      if (result.success) {
        // Save class recommendation
        const yearLevel = students[0]?.year_level || "";
        if (classRecommendation) {
          await saveClassRecommendation(
            selectedClass,
            yearLevel,
            selectedSubject.id,
            selectedPeriod.id,
            classRecommendation
          );
        }

        // Reload grades to get updated IDs
        const studentIds = students.map(s => s.id);
        const updatedGrades = await fetchExistingGrades(
          studentIds,
          selectedSubject.id,
          selectedPeriod.id
        );
        setExistingGrades(updatedGrades);
      }

      return result;
    } catch (err) {
      const errorMessage = String(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [selectedSubject, selectedPeriod, selectedClass, students, existingGrades, gradeInputs, classRecommendation]);

  // Compute stats
  const stats = useMemo(() => {
    const total = students.length;
    let graded = 0;
    let totalScore = 0;

    students.forEach(student => {
      const input = gradeInputs[student.id];
      if (input) {
        const hasData = input.attitude || input.homework || input.quiz || input.exam;
        if (hasData) {
          graded++;
          const score = (parseInt(input.attitude) || 0) + 
                       (parseInt(input.homework) || 0) + 
                       (parseInt(input.quiz) || 0) + 
                       (parseInt(input.exam) || 0);
          totalScore += score;
        }
      }
    });

    return {
      graded,
      pending: total - graded,
      total,
      average: graded > 0 ? Math.round(totalScore / graded) : 0
    };
  }, [students, gradeInputs]);

  // Generate CSV template
  const generateTemplate = useCallback(() => {
    const headers = ["student_id", "student_name", "class", "subject", "attitude", "homework", "quiz", "exam", "report_comment", "study_recommendation"];
    const rows = students.map(s => [
      s.id,
      `"${s.name}"`,
      selectedClass || "",
      selectedSubject?.name || "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]);
    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  }, [students, selectedClass, selectedSubject]);

  // Export grades as CSV
  const exportGrades = useCallback(() => {
    const headers = ["student_id", "student_name", "class", "subject", "attitude", "homework", "quiz", "exam", "total", "grade", "report_comment", "study_recommendation"];
    const rows = students.map(s => {
      const input = gradeInputs[s.id] || emptyGradeInput;
      const attitude = parseInt(input.attitude) || 0;
      const homework = parseInt(input.homework) || 0;
      const quiz = parseInt(input.quiz) || 0;
      const exam = parseInt(input.exam) || 0;
      const total = attitude + homework + quiz + exam;
      const grade = calculateLetterGrade(total);
      
      return [
        s.id,
        `"${s.name}"`,
        selectedClass || "",
        selectedSubject?.name || "",
        input.attitude || "",
        input.homework || "",
        input.quiz || "",
        input.exam || "",
        total,
        grade,
        `"${(input.reportComment || "").replace(/"/g, '""')}"`,
        `"${(input.studyRecommendation || "").replace(/"/g, '""')}"`
      ];
    });
    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  }, [students, gradeInputs, selectedClass, selectedSubject]);

  return {
    // Data
    classes,
    students,
    subjects,
    academicPeriods,
    existingGrades,
    gradeInputs,
    classRecommendation,
    
    // Selection state
    selectedClass,
    selectedSubject,
    selectedPeriod,
    
    // Loading/error states
    loadingClasses,
    loadingStudents,
    loadingSubjects,
    loadingGrades,
    saving,
    error,
    
    // Actions
    setSelectedClass,
    setSelectedSubject,
    setSelectedPeriod,
    updateGradeInput,
    setClassRecommendation,
    applyClassRecommendationToAll,
    save,
    
    // Computed stats
    stats,
    
    // CSV helpers
    generateTemplate,
    exportGrades
  };
}
