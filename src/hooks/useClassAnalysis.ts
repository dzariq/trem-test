import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchDistinctClasses,
  fetchStudentsForClass,
  fetchAcademicPeriodsForAnalysis,
  fetchSubjectsForClass,
  fetchGradesForAnalysis,
  computeSubjectAverages,
  computeStudentScores,
  computeGradeDistribution,
  computeSubjectChanges,
  computeSummaryStats,
  ClassAnalysisStudent,
  SubjectInfo,
  AcademicPeriodInfo,
  SubjectGrade,
  SubjectAverage,
  StudentScore,
  SubjectChange,
} from "@/data/classAnalysis";

interface UseClassAnalysisReturn {
  // Data
  classes: string[];
  students: ClassAnalysisStudent[];
  subjects: SubjectInfo[];
  academicPeriods: AcademicPeriodInfo[];
  grades: SubjectGrade[];

  // Selection state
  selectedClass: string | null;
  selectedPeriodId: string | null;
  selectedSubjectIds: number[];
  comparePeriodId: string | null; // For Rising/Falling comparison

  // Loading states
  loading: boolean;
  loadingClasses: boolean;
  loadingData: boolean;
  error: string | null;

  // Actions
  setSelectedClass: (className: string | null) => void;
  setSelectedPeriodId: (periodId: string | null) => void;
  setSelectedSubjectIds: (subjectIds: number[]) => void;
  setComparePeriodId: (periodId: string | null) => void;
  toggleSubject: (subjectId: number) => void;
  selectAllSubjects: () => void;
  clearSubjects: () => void;

  // Computed data
  subjectAverages: SubjectAverage[];
  studentScores: StudentScore[];
  topPerformers: StudentScore[];
  middlePerformers: StudentScore[];
  atRiskStudents: StudentScore[];
  gradeDistribution: { range: string; count: number }[];
  risingSubjects: SubjectChange[];
  fallingSubjects: SubjectChange[];
  summaryStats: {
    classAverage: number;
    passCount: number;
    passRate: number;
    studentCount: number;
    bestSubject: SubjectAverage | null;
    worstSubject: SubjectAverage | null;
  };
  hasData: boolean;
}

export function useClassAnalysis(): UseClassAnalysisReturn {
  // Selection state
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [comparePeriodId, setComparePeriodId] = useState<string | null>(null);

  // Data state
  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<ClassAnalysisStudent[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriodInfo[]>(
    []
  );
  const [grades, setGrades] = useState<SubjectGrade[]>([]);

  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      setLoadingClasses(true);
      setError(null);
      try {
        const fetchedClasses = await fetchDistinctClasses();
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
        const periods = await fetchAcademicPeriodsForAnalysis();
        setAcademicPeriods(periods);
        // Auto-select first period
        if (periods.length > 0) {
          setSelectedPeriodId(periods[0].id);
          if (periods.length > 1) {
            setComparePeriodId(periods[1].id);
          }
        }
      } catch (err) {
        console.error("Failed to load academic periods:", err);
      }
    };
    loadPeriods();
  }, []);

  // Load students, subjects, and grades when class changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setSubjects([]);
      setGrades([]);
      setSelectedSubjectIds([]);
      return;
    }

    const loadClassData = async () => {
      setLoadingData(true);
      setError(null);

      try {
        // Fetch students
        const fetchedStudents = await fetchStudentsForClass(selectedClass);
        setStudents(fetchedStudents);

        if (fetchedStudents.length === 0) {
          setSubjects([]);
          setGrades([]);
          setSelectedSubjectIds([]);
          setLoadingData(false);
          return;
        }

        const studentIds = fetchedStudents.map((s) => s.id);

        // Fetch subjects that have grades
        const fetchedSubjects = await fetchSubjectsForClass(studentIds);
        setSubjects(fetchedSubjects);

        // Auto-select all subjects
        setSelectedSubjectIds(fetchedSubjects.map((s) => s.id));

        // Fetch grades (all periods for comparison)
        const fetchedGrades = await fetchGradesForAnalysis(studentIds);
        setGrades(fetchedGrades);
      } catch (err) {
        setError("Failed to load class data");
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };

    loadClassData();
  }, [selectedClass]);

  // Actions
  const toggleSubject = useCallback((subjectId: number) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  }, []);

  const selectAllSubjects = useCallback(() => {
    setSelectedSubjectIds(subjects.map((s) => s.id));
  }, [subjects]);

  const clearSubjects = useCallback(() => {
    setSelectedSubjectIds([]);
  }, []);

  // Computed: Filter grades by selected period
  const filteredGrades = useMemo(() => {
    if (!selectedPeriodId) return grades;
    return grades.filter((g) => g.academic_period_id === selectedPeriodId);
  }, [grades, selectedPeriodId]);

  // Computed: Subject averages
  const subjectAverages = useMemo(() => {
    return computeSubjectAverages(filteredGrades, subjects, selectedSubjectIds);
  }, [filteredGrades, subjects, selectedSubjectIds]);

  // Computed: Student scores
  const studentScores = useMemo(() => {
    return computeStudentScores(filteredGrades, students, selectedSubjectIds);
  }, [filteredGrades, students, selectedSubjectIds]);

  // Computed: Performance tiers
  const topPerformers = useMemo(
    () => studentScores.filter((s) => s.averageScore >= 80),
    [studentScores]
  );
  const middlePerformers = useMemo(
    () =>
      studentScores.filter(
        (s) => s.averageScore >= 60 && s.averageScore < 80
      ),
    [studentScores]
  );
  const atRiskStudents = useMemo(
    () => studentScores.filter((s) => s.averageScore < 60),
    [studentScores]
  );

  // Computed: Grade distribution
  const gradeDistribution = useMemo(
    () => computeGradeDistribution(studentScores),
    [studentScores]
  );

  // Computed: Rising/Falling subjects (requires two periods)
  const { rising: risingSubjects, falling: fallingSubjects } = useMemo(() => {
    if (!selectedPeriodId || !comparePeriodId) {
      return { rising: [], falling: [] };
    }
    return computeSubjectChanges(
      grades,
      subjects,
      comparePeriodId, // First (older) period
      selectedPeriodId, // Current period
      selectedSubjectIds
    );
  }, [
    grades,
    subjects,
    selectedPeriodId,
    comparePeriodId,
    selectedSubjectIds,
  ]);

  // Computed: Summary stats
  const summaryStats = useMemo(() => {
    const stats = computeSummaryStats(studentScores);
    return {
      ...stats,
      bestSubject: subjectAverages.length > 0 ? subjectAverages[0] : null,
      worstSubject:
        subjectAverages.length > 0
          ? subjectAverages[subjectAverages.length - 1]
          : null,
    };
  }, [studentScores, subjectAverages]);

  const hasData =
    filteredGrades.length > 0 && students.length > 0 && subjects.length > 0;

  return {
    // Data
    classes,
    students,
    subjects,
    academicPeriods,
    grades,

    // Selection state
    selectedClass,
    selectedPeriodId,
    selectedSubjectIds,
    comparePeriodId,

    // Loading states
    loading: loadingClasses || loadingData,
    loadingClasses,
    loadingData,
    error,

    // Actions
    setSelectedClass,
    setSelectedPeriodId,
    setSelectedSubjectIds,
    setComparePeriodId,
    toggleSubject,
    selectAllSubjects,
    clearSubjects,

    // Computed data
    subjectAverages,
    studentScores,
    topPerformers,
    middlePerformers,
    atRiskStudents,
    gradeDistribution,
    risingSubjects,
    fallingSubjects,
    summaryStats,
    hasData,
  };
}
