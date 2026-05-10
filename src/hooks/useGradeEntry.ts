import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import {
  fetchAvailableClasses,
  fetchStudentsByClass,
  fetchSubjects,
  fetchAcademicPeriods,
  fetchExistingGrades,
  saveGrades,
  fetchClassStudyRecommendation,
  saveClassStudyRecommendation,
  GradeEntryStudent,
  SubjectInfo,
  AcademicPeriod,
  StudentGradeRecord,
  GradeInput,
  calculateLetterGrade,
  buildGradeInputsFromExistingGrades,
  computeGradeEntryStats,
  emptyGradeInput,
} from "@/data/gradeEntry";

interface UseGradeEntryReturn {
  // Data
  classes: string[];
  students: GradeEntryStudent[];
  subjects: SubjectInfo[];
  academicPeriods: AcademicPeriod[];
  academicPeriodsForYear: AcademicPeriod[];
  availableAcademicYears: number[];
  existingGrades: Map<string, StudentGradeRecord>;
  gradeInputs: Record<string, GradeInput>;
  classRecommendation: string;
  classRecommendationUpdatedAt: string | null;
  
  // Selection state
  selectedClass: string | null;
  selectedSubject: SubjectInfo | null;
  selectedPeriod: AcademicPeriod | null;
  selectedAcademicYear: number | null;
  
  // Loading/error states
  loadingClasses: boolean;
  loadingStudents: boolean;
  loadingSubjects: boolean;
  loadingGrades: boolean;
  savingClassRecommendation: boolean;
  saving: boolean;
  error: string | null;
  
  // Actions
  setSelectedClass: (className: string | null) => void;
  setSelectedSubject: (subject: SubjectInfo | null) => void;
  setSelectedPeriod: (period: AcademicPeriod | null) => void;
  setSelectedAcademicYear: (year: number | null) => void;
  updateGradeInput: (studentId: string, field: keyof GradeInput, value: string) => void;
  setClassRecommendation: (recommendation: string) => void;
  saveClassRecommendation: () => Promise<{ success: boolean; error?: string }>;
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

export function useGradeEntry(): UseGradeEntryReturn {
  const teacherScope = useTeacherScope();
  const isTeacher = teacherScope.isTeacher;
  const allowedClassNames = useMemo(
    () => teacherScope.allowedClassYears.map((cls) => cls.class_name),
    [teacherScope.allowedClassYears]
  );

  // Selection state
  const [selectedClassState, setSelectedClassState] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  
  // Data state
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<GradeEntryStudent[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [existingGrades, setExistingGrades] = useState<Map<string, StudentGradeRecord>>(new Map());
  const [gradeInputs, setGradeInputs] = useState<Record<string, GradeInput>>({});
  const [classRecommendation, setClassRecommendationState] = useState<string>("");
  const [classRecommendationUpdatedAt, setClassRecommendationUpdatedAt] = useState<string | null>(null);
  
  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [savingClassRecommendation, setSavingClassRecommendation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClass = isTeacher
    ? teacherScope.selectedClassYear?.class_name ?? null
    : selectedClassState;

  const setSelectedClass = useCallback(
    (className: string | null) => {
      if (!className) {
        setSelectedClassState(null);
        return;
      }
      if (isTeacher) {
        const classYear = teacherScope.allowedClassYears.find(
          (cls) => cls.class_name === className
        );
        if (classYear) {
          teacherScope.setSelectedClassYearId(classYear.id);
          return;
        }
        toast({
          title: "Class not available",
          description: "Please select an assigned class.",
          variant: "destructive",
        });
        return;
      }
      setSelectedClassState(className);
    },
    [isTeacher, teacherScope.allowedClassYears, teacherScope.setSelectedClassYearId]
  );

  // Load classes on mount
  useEffect(() => {
    if (isTeacher) {
      setClasses(allowedClassNames);
      setLoadingClasses(teacherScope.loading);
      return;
    }
    const loadClasses = async () => {
      setLoadingClasses(true);
      setError(null);
      try {
        const fetchedClasses = await fetchAvailableClasses();
        setClasses(fetchedClasses);
      } catch (err) {
        setError("Failed to load classes");
        console.error(err);
        toast({
          title: "Classes unavailable",
          description: "Unable to load classes right now.",
          variant: "destructive",
        });
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, [allowedClassNames, isTeacher, teacherScope.loading]);

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

  const availableAcademicYears = useMemo(() => {
    const years = academicPeriods
      .map((period) => period.academic_year)
      .filter((year): year is number => Number.isInteger(year));
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [academicPeriods]);

  const academicPeriodsForYear = useMemo(() => {
    if (!selectedAcademicYear) return academicPeriods;
    return academicPeriods.filter(
      (period) => period.academic_year === selectedAcademicYear
    );
  }, [academicPeriods, selectedAcademicYear]);

  useEffect(() => {
    if (selectedAcademicYear) return;
    const openPeriod = academicPeriods.find((p) => p.is_open_for_grading);
    if (openPeriod?.academic_year) {
      setSelectedAcademicYear(openPeriod.academic_year);
      return;
    }
    if (availableAcademicYears.length > 0) {
      setSelectedAcademicYear(availableAcademicYears[0]);
    }
  }, [selectedAcademicYear, academicPeriods, availableAcademicYears]);

  useEffect(() => {
    if (academicPeriodsForYear.length === 0) {
      setSelectedPeriod(null);
      return;
    }
    if (!selectedPeriod) {
      setSelectedPeriod(academicPeriodsForYear[0]);
      return;
    }
    const valid = academicPeriodsForYear.some((p) => p.id === selectedPeriod.id);
    if (!valid) {
      setSelectedPeriod(academicPeriodsForYear[0]);
    }
  }, [academicPeriodsForYear, selectedPeriod]);

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

        if (isTeacher) {
          const classYearId =
            teacherScope.allowedClassYears.find((cls) => cls.class_name === selectedClass)?.id ??
            teacherScope.selectedClassYearId;
          if (!classYearId) {
            setSubjects([]);
            setSelectedSubject(null);
            toast({
              title: "Class not available",
              description: "Please select an assigned class.",
              variant: "destructive",
            });
            return;
          }
          const allowedSubjects = await teacherScope.getAllowedSubjects(classYearId);
          // Map to SubjectInfo with code field
          setSubjects(allowedSubjects.map(s => ({ ...s, code: null })));
        } else {
          // Get year level from first student
          const yearLevel = fetchedStudents[0]?.year_level;
          const fetchedSubjects = await fetchSubjects(yearLevel);
          setSubjects(fetchedSubjects);
        }
      } catch (err) {
        setError("Failed to load students or subjects");
        console.error(err);
        toast({
          title: "Class data unavailable",
          description: "Unable to load students or subjects.",
          variant: "destructive",
        });
      } finally {
        setLoadingStudents(false);
        setLoadingSubjects(false);
      }
    };

    loadStudentsAndSubjects();
  }, [isTeacher, selectedClass, teacherScope.allowedClassYears, teacherScope.getAllowedSubjects, teacherScope.selectedClassYearId]);

  const allowedSubjectIds = useMemo(() => {
    if (!isTeacher) return null;
    const classYearId = teacherScope.allowedClassYears.find(
      (cls) => cls.class_name === selectedClass
    )?.id;
    if (!classYearId) return [];
    return (teacherScope.subjectsByClassYearId[classYearId] || []).map((s) => s.id);
  }, [isTeacher, selectedClass, teacherScope.allowedClassYears, teacherScope.subjectsByClassYearId]);

  useEffect(() => {
    if (!isTeacher) return;
    if (!selectedSubject) return;
    if (!allowedSubjectIds || allowedSubjectIds.length === 0) return;

    if (!allowedSubjectIds.includes(selectedSubject.id)) {
      const classYearId = teacherScope.allowedClassYears.find(
        (cls) => cls.class_name === selectedClass
      )?.id;
      const nextSubjectData = classYearId
        ? teacherScope.subjectsByClassYearId[classYearId]?.[0]
        : null;
      const nextSubject = nextSubjectData ? { ...nextSubjectData, code: null } : null;
      setSelectedSubject(nextSubject);
      toast({
        title: "Subject updated",
        description: "Your selected subject is no longer available.",
      });
    }
  }, [
    allowedSubjectIds,
    isTeacher,
    selectedClass,
    selectedSubject,
    teacherScope.allowedClassYears,
    teacherScope.subjectsByClassYearId,
  ]);

  useEffect(() => {
    if (selectedSubject || subjects.length === 0) return;
    setSelectedSubject(subjects[0]);
  }, [selectedSubject, subjects]);

  // Load existing grades when class, subject, or period changes
  useEffect(() => {
    if (isTeacher) {
      if (!selectedClass || !allowedClassNames.includes(selectedClass)) {
        return;
      }
      if (selectedSubject && allowedSubjectIds && !allowedSubjectIds.includes(selectedSubject.id)) {
        return;
      }
    }
    if (!selectedClass || !selectedSubject || !selectedPeriod || students.length === 0) {
      setExistingGrades(new Map());
      setGradeInputs({});
      setClassRecommendationState("");
      setClassRecommendationUpdatedAt(null);
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
        setGradeInputs(buildGradeInputsFromExistingGrades(students, grades));

        // Load class recommendation
        const recommendation = await fetchClassStudyRecommendation(
          selectedClass,
          selectedSubject.id,
          selectedPeriod.id
        );
        setClassRecommendationState(recommendation?.recommendation || "");
        setClassRecommendationUpdatedAt(recommendation?.updated_at || null);
      } catch (err) {
        setError("Failed to load existing grades");
        console.error(err);
        toast({
          title: "Grades unavailable",
          description: "Unable to load existing grades.",
          variant: "destructive",
        });
      } finally {
        setLoadingGrades(false);
      }
    };

    loadGrades();
  }, [
    allowedClassNames,
    allowedSubjectIds,
    isTeacher,
    selectedClass,
    selectedSubject,
    selectedPeriod,
    students,
  ]);

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

  // Save class recommendation only
  const saveClassRecommendation = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!selectedSubject || !selectedPeriod || !selectedClass) {
      return { success: false, error: "Please select class, subject, and period" };
    }
    if (isTeacher) {
      if (!allowedClassNames.includes(selectedClass)) {
        toast({
          title: "Class not available",
          description: "Please select an assigned class.",
          variant: "destructive",
        });
        return { success: false, error: "Selected class is not available." };
      }
      if (allowedSubjectIds && !allowedSubjectIds.includes(selectedSubject.id)) {
        toast({
          title: "Subject not available",
          description: "Please select an assigned subject.",
          variant: "destructive",
        });
        return { success: false, error: "Selected subject is not available." };
      }
    }

    setSavingClassRecommendation(true);
    setError(null);

    try {
      const result = await saveClassStudyRecommendation(
        selectedClass,
        selectedSubject.id,
        selectedPeriod.id,
        classRecommendation
      );
      if (result.success) {
        setClassRecommendationState(result.record?.recommendation ?? classRecommendation);
        setClassRecommendationUpdatedAt(result.record?.updated_at ?? null);
      } else if (result.error) {
        // Surface RLS / permission failures that previously failed silently.
        toast({
          title: "Couldn't save class recommendation",
          description: result.error,
          variant: "destructive",
        });
      }
      return { success: result.success, error: result.error };
    } catch (err) {
      const errorMessage = String(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSavingClassRecommendation(false);
    }
  }, [
    allowedClassNames,
    allowedSubjectIds,
    classRecommendation,
    isTeacher,
    selectedClass,
    selectedPeriod,
    selectedSubject,
  ]);

  // Save grades
  const save = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!selectedSubject || !selectedPeriod || !selectedClass) {
      return { success: false, error: "Please select class, subject, and period" };
    }
    if (isTeacher) {
      if (!allowedClassNames.includes(selectedClass)) {
        toast({
          title: "Class not available",
          description: "Please select an assigned class.",
          variant: "destructive",
        });
        return { success: false, error: "Selected class is not available." };
      }
      if (allowedSubjectIds && !allowedSubjectIds.includes(selectedSubject.id)) {
        toast({
          title: "Subject not available",
          description: "Please select an assigned subject.",
          variant: "destructive",
        });
        return { success: false, error: "Selected subject is not available." };
      }
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
  }, [
    allowedClassNames,
    allowedSubjectIds,
    isTeacher,
    selectedSubject,
    selectedPeriod,
    selectedClass,
    students,
    existingGrades,
    gradeInputs,
  ]);

  // Compute stats
  const stats = useMemo(
    () => computeGradeEntryStats(students, gradeInputs),
    [students, gradeInputs]
  );

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
    academicPeriodsForYear,
    availableAcademicYears,
    existingGrades,
    gradeInputs,
    classRecommendation,
    classRecommendationUpdatedAt,
    
    // Selection state
    selectedClass,
    selectedSubject,
    selectedPeriod,
    selectedAcademicYear,
    
    // Loading/error states
    loadingClasses,
    loadingStudents,
    loadingSubjects,
    loadingGrades,
    savingClassRecommendation,
    saving,
    error,
    
    // Actions
    setSelectedClass,
    setSelectedSubject,
    setSelectedPeriod,
    setSelectedAcademicYear,
    updateGradeInput,
    setClassRecommendation,
    saveClassRecommendation,
    save,
    
    // Computed stats
    stats,
    
    // CSV helpers
    generateTemplate,
    exportGrades
  };
}
