import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchDistinctClasses,
  fetchAcademicPeriodsForAnalysis,
  fetchSubjectsForClass,
  computeSubjectAverages,
  computeStudentScores,
  computeGradeDistribution,
  computeSingleSubjectDistribution,
  computeSubjectChanges,
  computeSummaryStats,
  computeTrendData,
  computeBoxPlotStats,
  fetchCohortAveragesByYearLevelAndPeriod,
  ClassAnalysisStudent,
  SubjectInfo,
  AcademicPeriodInfo,
  SubjectGrade,
  SubjectAverage,
  StudentScore,
  SubjectChange,
  BoxPlotStats,
} from "@/data/classAnalysis";
import { useClassAnalysisData } from "@/hooks/useClassAnalysisData";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { toast } from "@/hooks/use-toast";

interface UseClassAnalysisReturn {
  // Data
  classes: string[];
  students: ClassAnalysisStudent[];
  subjects: SubjectInfo[];
  academicPeriods: AcademicPeriodInfo[];
  academicPeriodsForYear: AcademicPeriodInfo[];
  availableAcademicYears: number[];
  grades: SubjectGrade[];

  // Selection state
  selectedClass: string | null;
  selectedAcademicYear: number | null;
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
  setSelectedAcademicYear: (year: number | null) => void;
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
    gradedStudentCount: number;
    bestSubject: SubjectAverage | null;
    worstSubject: SubjectAverage | null;
  };
  hasData: boolean;
  hasYearGrades: boolean;
  
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

  // Cohort averages (year-level)
  cohortAveragesBySubjectId: Record<number, number>;
  cohortYearLevel: string | null;
}

export function useClassAnalysis(): UseClassAnalysisReturn {
  const teacherScope = useTeacherScope();
  const isTeacher = teacherScope.isTeacher;
  const allowedClassNames = useMemo(
    () => teacherScope.allowedClassYears.map((cls) => cls.class_name),
    [teacherScope.allowedClassYears]
  );

  // Selection state
  const [selectedClassState, setSelectedClassState] = useState<string | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
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
  const [cohortAveragesBySubjectId, setCohortAveragesBySubjectId] = useState<Record<number, number>>({});

  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
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
        const fetchedClasses = await fetchDistinctClasses();
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

  useEffect(() => {
    if (!isTeacher) return;
    if (teacherScope.loading) return;
    if (!selectedClass) return;
    if (allowedClassNames.includes(selectedClass)) return;
    const fallback = allowedClassNames[0] ?? null;
    if (fallback) {
      setSelectedClass(fallback);
      toast({
        title: "Class updated",
        description: "Your selected class is no longer available.",
      });
    }
  }, [allowedClassNames, isTeacher, selectedClass, setSelectedClass, teacherScope.loading]);

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

  const availableAcademicYears = useMemo(() => {
    const years = academicPeriods
      .map((period) => period.academic_year)
      .filter((year): year is number => Number.isFinite(year));
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [academicPeriods]);

  const academicPeriodsForYear = useMemo(() => {
    if (!selectedAcademicYear) return academicPeriods;
    return academicPeriods.filter(
      (period) => period.academic_year === selectedAcademicYear
    );
  }, [academicPeriods, selectedAcademicYear]);

  const yearPeriodIds = useMemo(() => {
    return academicPeriodsForYear.map((period) => period.id);
  }, [academicPeriodsForYear]);

  const { rosterStudents, gradeRows, loading: dataLoading, error: dataError } =
    useClassAnalysisData({
      classId: selectedClass,
      examPeriodIds: yearPeriodIds,
    });

  // Sync roster students when class changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setSubjects([]);
      setGrades([]);
      setSelectedSubjectIds([]);
      setBandsSelectedSubjectId(null);
      setCohortAveragesBySubjectId({});
      return;
    }
    setStudents(rosterStudents);
  }, [selectedClass, rosterStudents]);

  // Load subjects when roster updates
  useEffect(() => {
    if (!selectedClass) return;
    if (rosterStudents.length === 0) {
      setSubjects([]);
      setSelectedSubjectIds([]);
      setBandsSelectedSubjectId(null);
      setCohortAveragesBySubjectId({});
      return;
    }

    const loadSubjects = async () => {
      setLoadingSubjects(true);
      setError(null);
      try {
        const studentIds = rosterStudents.map((student) => student.id);
        const fetchedSubjects = await fetchSubjectsForClass(studentIds);
        if (isTeacher) {
          const classYearId =
            teacherScope.allowedClassYears.find((cls) => cls.class_name === selectedClass)?.id ??
            teacherScope.selectedClassYearId;
          if (!classYearId) {
            setSubjects([]);
            setSelectedSubjectIds([]);
            setBandsSelectedSubjectId(null);
            return;
          }
          const allowedSubjects = await teacherScope.getAllowedSubjects(classYearId);
          const allowedIds = new Set(allowedSubjects.map((s) => s.id));
          const filtered = fetchedSubjects.filter((subject) => allowedIds.has(subject.id));
          setSubjects(filtered);

          // Auto-select all subjects
          setSelectedSubjectIds(filtered.map((s) => s.id));

          // Auto-select first subject for Bands tab
          if (filtered.length > 0) {
            setBandsSelectedSubjectId(filtered[0].id);
          }
        } else {
          setSubjects(fetchedSubjects);

          // Auto-select all subjects
          setSelectedSubjectIds(fetchedSubjects.map((s) => s.id));

          // Auto-select first subject for Bands tab
          if (fetchedSubjects.length > 0) {
            setBandsSelectedSubjectId(fetchedSubjects[0].id);
          }
        }
      } catch (err) {
        setError("Failed to load class subjects");
        console.error(err);
        setSubjects([]);
        toast({
          title: "Subjects unavailable",
          description: "Unable to load class subjects.",
          variant: "destructive",
        });
      } finally {
        setLoadingSubjects(false);
      }
    };

    loadSubjects();
  }, [
    isTeacher,
    rosterStudents,
    selectedClass,
    teacherScope.allowedClassYears,
    teacherScope.getAllowedSubjects,
    teacherScope.selectedClassYearId,
  ]);

  // Pick academic year defaults based on data availability
  useEffect(() => {
    if (selectedAcademicYear) return;
    const yearsWithGrades = new Set(
      gradeRows
        .map((row) => row.academic_year)
        .filter((year): year is number => Number.isFinite(year))
    );
    const latestWithGrades = Math.max(...Array.from(yearsWithGrades), -Infinity);
    if (Number.isFinite(latestWithGrades)) {
      setSelectedAcademicYear(latestWithGrades);
      return;
    }
    if (availableAcademicYears.length > 0) {
      setSelectedAcademicYear(availableAcademicYears[0]);
      return;
    }
    setSelectedAcademicYear(new Date().getFullYear());
  }, [selectedClass, selectedAcademicYear, gradeRows, availableAcademicYears]);

  useEffect(() => {
    if (!selectedAcademicYear) return;
    if (availableAcademicYears.length === 0) return;
    if (!availableAcademicYears.includes(selectedAcademicYear)) {
      setSelectedAcademicYear(availableAcademicYears[0]);
    }
  }, [selectedAcademicYear, availableAcademicYears]);

  // Ensure selected periods stay within the selected academic year
  useEffect(() => {
    if (academicPeriodsForYear.length === 0) {
      setSelectedPeriodId(null);
      setComparePeriodId(null);
      return;
    }
    const validPeriodIds = new Set(academicPeriodsForYear.map((p) => p.id));
    if (!selectedPeriodId || !validPeriodIds.has(selectedPeriodId)) {
      setSelectedPeriodId(academicPeriodsForYear[0].id);
    }
    const compareCandidates = academicPeriodsForYear.filter(
      (period) => period.id !== selectedPeriodId
    );
    if (!comparePeriodId || !validPeriodIds.has(comparePeriodId)) {
      setComparePeriodId(compareCandidates[0]?.id || academicPeriodsForYear[0].id);
    }
  }, [
    academicPeriodsForYear,
    selectedPeriodId,
    comparePeriodId,
  ]);

  // Map normalized grade rows into class analysis grades
  useEffect(() => {
    if (!selectedClass) {
      setGrades([]);
      return;
    }
    const mappedGrades: SubjectGrade[] = gradeRows.map((row) => ({
      student_id: row.student_id,
      subject_id: row.subject_id,
      academic_period_id: row.exam_period_id,
      subject_name: "",
      academic_period_name: "",
      academic_year: row.academic_year,
      attitude_marks: 0,
      homework_marks: 0,
      quiz_marks: 0,
      exam_marks: 0,
      total_marks: row.score_percent,
      letter_grade: null,
    }));
    setGrades(mappedGrades);
  }, [selectedClass, gradeRows]);

  const cohortYearLevel = useMemo(() => {
    const match = (selectedClass ?? "").match(/^Y\d{1,2}/);
    return match?.[0] ?? null;
  }, [selectedClass]);

  useEffect(() => {
    let isMounted = true;
    const loadCohortAverages = async () => {
      if (!cohortYearLevel || !selectedPeriodId) {
        if (isMounted) setCohortAveragesBySubjectId({});
        return;
      }
      try {
        const averages = await fetchCohortAveragesByYearLevelAndPeriod(
          cohortYearLevel,
          selectedPeriodId
        );
        if (!isMounted) return;
        const map: Record<number, number> = {};
        averages.forEach((entry) => {
          map[entry.subjectId] = entry.average;
        });
        setCohortAveragesBySubjectId(map);
      } catch (err) {
        console.error("[classAnalysis/cohortAverages]", err);
        if (isMounted) {
          setCohortAveragesBySubjectId({});
        }
      }
    };
    loadCohortAverages();
    return () => {
      isMounted = false;
    };
  }, [cohortYearLevel, selectedPeriodId]);

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
    const stats = computeSummaryStats(studentScores, 50, students.length);
    return {
      ...stats,
      bestSubject: subjectAverages.length > 0 ? subjectAverages[0] : null,
      worstSubject:
        subjectAverages.length > 0
          ? subjectAverages[subjectAverages.length - 1]
          : null,
    };
  }, [studentScores, subjectAverages, students.length]);

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

  const hasYearGrades = grades.length > 0;
  const hasData =
    filteredGrades.length > 0 && students.length > 0 && subjects.length > 0;
  const loadingData = dataLoading || loadingSubjects;
  const combinedError = error || dataError;

  return {
    // Data
    classes,
    students,
    subjects,
    academicPeriods,
    academicPeriodsForYear,
    availableAcademicYears,
    grades,

    // Selection state
    selectedClass,
    selectedAcademicYear,
    selectedPeriodId,
    selectedSubjectIds,
    comparePeriodId,
    bandsSelectedSubjectId,

    // Loading states
    loading: loadingClasses || loadingData,
    loadingClasses,
    loadingData,
    error: combinedError,

    // Actions
    setSelectedClass,
    setSelectedAcademicYear,
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
    hasYearGrades,
    
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

    // Cohort averages
    cohortAveragesBySubjectId,
    cohortYearLevel,
  };
}
