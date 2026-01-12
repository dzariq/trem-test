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
  computeSingleSubjectDistribution,
  computeSubjectChanges,
  computeSummaryStats,
  computeTrendData,
  computeBoxPlotStats,
  ClassAnalysisStudent,
  SubjectInfo,
  AcademicPeriodInfo,
  SubjectGrade,
  SubjectAverage,
  StudentScore,
  SubjectChange,
  BoxPlotStats,
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
  bandsSelectedSubjectId: number | null; // For Bands tab single subject

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
  setBandsSelectedSubjectId: (subjectId: number | null) => void;
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
  
  // Bands tab computed data
  bandsDistribution: { range: string; count: number }[];
  bandsRankedStudents: { studentId: string; studentName: string; score: number }[];
  bandsTopPerformers: { studentId: string; studentName: string; score: number }[];
  bandsMiddlePerformers: { studentId: string; studentName: string; score: number }[];
  bandsAtRiskStudents: { studentId: string; studentName: string; score: number }[];
  
  // Trends tab computed data
  trendData: { period: string; periodId: string; [key: string]: number | string }[];
  hasTrendData: boolean;
  
  // Box Plot tab computed data
  boxPlotStats: BoxPlotStats[];
}

export function useClassAnalysis(): UseClassAnalysisReturn {
  // Selection state
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [comparePeriodId, setComparePeriodId] = useState<string | null>(null);
  const [bandsSelectedSubjectId, setBandsSelectedSubjectId] = useState<number | null>(null);

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
      setBandsSelectedSubjectId(null);
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
          setBandsSelectedSubjectId(null);
          setLoadingData(false);
          return;
        }

        const studentIds = fetchedStudents.map((s) => s.id);

        // Fetch subjects that have grades
        const fetchedSubjects = await fetchSubjectsForClass(studentIds);
        setSubjects(fetchedSubjects);

        // Auto-select all subjects
        setSelectedSubjectIds(fetchedSubjects.map((s) => s.id));
        
        // Auto-select first subject for Bands tab
        if (fetchedSubjects.length > 0) {
          setBandsSelectedSubjectId(fetchedSubjects[0].id);
        }

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

  // ==== BANDS TAB: Single subject distribution ====
  const bandsData = useMemo(() => {
    if (!bandsSelectedSubjectId) {
      return { distribution: [], rankedStudents: [] };
    }
    return computeSingleSubjectDistribution(filteredGrades, students, bandsSelectedSubjectId);
  }, [filteredGrades, students, bandsSelectedSubjectId]);

  const bandsDistribution = bandsData.distribution;
  const bandsRankedStudents = bandsData.rankedStudents;

  const bandsTopPerformers = useMemo(
    () => bandsRankedStudents.filter((s) => s.score >= 80),
    [bandsRankedStudents]
  );
  const bandsMiddlePerformers = useMemo(
    () => bandsRankedStudents.filter((s) => s.score >= 60 && s.score < 80),
    [bandsRankedStudents]
  );
  const bandsAtRiskStudents = useMemo(
    () => bandsRankedStudents.filter((s) => s.score < 60),
    [bandsRankedStudents]
  );

  // ==== TRENDS TAB: Multi-period data ====
  const trendData = useMemo(() => {
    return computeTrendData(grades, subjects, academicPeriods, selectedSubjectIds);
  }, [grades, subjects, academicPeriods, selectedSubjectIds]);
  
  const hasTrendData = trendData.length >= 2;

  // ==== BOX PLOT TAB ====
  const boxPlotStats = useMemo(() => {
    return computeBoxPlotStats(filteredGrades, subjects, selectedSubjectIds);
  }, [filteredGrades, subjects, selectedSubjectIds]);

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
    bandsSelectedSubjectId,

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
    setBandsSelectedSubjectId,
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
    
    // Bands tab
    bandsDistribution,
    bandsRankedStudents,
    bandsTopPerformers,
    bandsMiddlePerformers,
    bandsAtRiskStudents,
    
    // Trends tab
    trendData,
    hasTrendData,
    
    // Box Plot tab
    boxPlotStats,
  };
}
