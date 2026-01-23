import { supabase } from "@/lib/supabase";

// Types
export interface ClassAnalysisStudent {
  id: string;
  name: string;
  class: string;
  year_level: string;
}

export interface SubjectGrade {
  student_id: string;
  subject_id: number;
  subject_name: string;
  academic_period_id: string;
  academic_period_name: string;
  academic_year?: number | null;
  attitude_marks: number;
  homework_marks: number;
  quiz_marks: number;
  exam_marks: number;
  total_marks: number;
  letter_grade: string | null;
}

export interface SubjectInfo {
  id: number;
  name: string;
  code: string | null;
}

export interface AcademicPeriodInfo {
  id: string;
  name: string;
  code: string;
  sort_order: number | null;
  academic_year?: number | null;
}

export interface SubjectAverage {
  subjectId: number;
  subjectName: string;
  average: number;
  gradeCount: number;
}

export interface StudentScore {
  studentId: string;
  studentName: string;
  averageScore: number;
  gradeCount: number;
}

export interface SubjectChange {
  name: string;
  first: number;
  last: number;
  change: number;
}

export interface CohortAverage {
  subjectId: number;
  average: number;
}

const logSupabaseError = (
  context: string,
  error: { code?: string; message?: string; details?: string; hint?: string }
) => {
  console.error(`[${context}]`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
};

// Fetch distinct classes from students table
export async function fetchDistinctClasses(): Promise<string[]> {
  const { data, error } = await supabase
    .from("students")
    .select("class")
    .eq("archived", false)
    .not("class", "eq", "")
    .order("class");

  if (error) {
    logSupabaseError("classAnalysis/fetchDistinctClasses", error);
    throw error;
  }

  const uniqueClasses = [...new Set(data?.map((s) => s.class).filter(Boolean))];
  return uniqueClasses;
}

// Fetch students for a class
export async function fetchStudentsForClass(
  className: string
): Promise<ClassAnalysisStudent[]> {
  const { data, error } = await supabase
    .from("students")
    .select("id, name, class, year_level")
    .eq("class", className)
    .eq("archived", false)
    .order("name");

  if (error) {
    logSupabaseError("classAnalysis/fetchStudentsForClass", error);
    throw error;
  }

  return data || [];
}

// Fetch academic periods (for year/exam filtering)
export async function fetchAcademicPeriodsForAnalysis(): Promise<
  AcademicPeriodInfo[]
> {
  const { data, error } = await supabase
    .from("academic_periods")
    .select("id, name, code, sort_order, academic_year")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    logSupabaseError("classAnalysis/fetchAcademicPeriodsForAnalysis", error);
    throw error;
  }

  return data || [];
}

// Fetch distinct subjects from student_grades for the given student IDs
export async function fetchSubjectsForClass(
  studentIds: string[]
): Promise<SubjectInfo[]> {
  if (studentIds.length === 0) return [];

  // Get distinct subject_ids from grades
  const { data: gradeData, error: gradeError } = await supabase
    .from("student_grades")
    .select("subject_id")
    .in("student_id", studentIds);

  if (gradeError) {
    logSupabaseError("classAnalysis/fetchSubjectsForClass/grades", gradeError);
    throw gradeError;
  }

  const uniqueSubjectIds = [
    ...new Set(gradeData?.map((g) => g.subject_id).filter(Boolean)),
  ];

  if (uniqueSubjectIds.length === 0) return [];

  // Get subject names
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, name, code")
    .in("id", uniqueSubjectIds)
    .order("name");

  if (subjectsError) {
    logSupabaseError("classAnalysis/fetchSubjectsForClass/subjects", subjectsError);
    throw subjectsError;
  }

  return subjects || [];
}

// Fetch all grades for students + optional period filter
export async function fetchGradesForAnalysis(
  studentIds: string[],
  academicPeriodIds?: string[]
): Promise<SubjectGrade[]> {
  if (studentIds.length === 0) return [];

  let query = supabase
    .from("student_grades")
    .select(
      `
      student_id,
      subject_id,
      academic_period_id,
      attitude_marks,
      homework_marks,
      quiz_marks,
      exam_marks,
      total_marks,
      letter_grade
    `
    )
    .in("student_id", studentIds);

  if (academicPeriodIds && academicPeriodIds.length > 0) {
    query = query.in("academic_period_id", academicPeriodIds);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseError("classAnalysis/fetchGradesForAnalysis", error);
    throw error;
  }

  return (
    data?.map((g) => ({
      student_id: g.student_id,
      subject_id: g.subject_id,
      academic_period_id: g.academic_period_id,
      subject_name: "", // Will be populated later
      academic_period_name: "", // Will be populated later
      attitude_marks: g.attitude_marks || 0,
      homework_marks: g.homework_marks || 0,
      quiz_marks: g.quiz_marks || 0,
      exam_marks: g.exam_marks || 0,
      total_marks: g.total_marks || 0,
      letter_grade: g.letter_grade,
    })) || []
  );
}

export async function fetchCohortAveragesByYearLevelAndPeriod(
  yearLevel: string,
  academicPeriodId: string
): Promise<CohortAverage[]> {
  const { data, error } = await supabase.rpc(
    "get_cohort_averages_by_year_level_and_period_scoped",
    {
      p_year_level: yearLevel,
      p_academic_period_id: academicPeriodId,
    }
  );

  if (error) {
    logSupabaseError("classAnalysis/fetchCohortAveragesByYearLevelAndPeriod", error);
    throw error;
  }

  return (
    data?.map((row: { subject_id: number; cohort_avg: number | null }) => ({
      subjectId: row.subject_id,
      average: Number.isFinite(row.cohort_avg) ? (row.cohort_avg as number) : 0,
    })) || []
  );
}

// Compute subject averages
export function computeSubjectAverages(
  grades: SubjectGrade[],
  subjects: SubjectInfo[],
  selectedSubjectIds: number[]
): SubjectAverage[] {
  const subjectMap = new Map<number, { sum: number; count: number }>();

  grades.forEach((g) => {
    if (
      selectedSubjectIds.length > 0 &&
      !selectedSubjectIds.includes(g.subject_id)
    ) {
      return;
    }
    if (!subjectMap.has(g.subject_id)) {
      subjectMap.set(g.subject_id, { sum: 0, count: 0 });
    }
    const entry = subjectMap.get(g.subject_id)!;
    entry.sum += g.total_marks;
    entry.count++;
  });

  const subjectIdToName = new Map(subjects.map((s) => [s.id, s.name]));

  return Array.from(subjectMap.entries())
    .map(([subjectId, data]) => ({
      subjectId,
      subjectName: subjectIdToName.get(subjectId) || `Subject ${subjectId}`,
      average: data.count > 0 ? data.sum / data.count : 0,
      gradeCount: data.count,
    }))
    .sort((a, b) => b.average - a.average);
}

// Compute student scores (average across selected subjects)
export function computeStudentScores(
  grades: SubjectGrade[],
  students: ClassAnalysisStudent[],
  selectedSubjectIds: number[]
): StudentScore[] {
  const studentMap = new Map<string, { sum: number; count: number }>();

  grades.forEach((g) => {
    if (
      selectedSubjectIds.length > 0 &&
      !selectedSubjectIds.includes(g.subject_id)
    ) {
      return;
    }
    if (!studentMap.has(g.student_id)) {
      studentMap.set(g.student_id, { sum: 0, count: 0 });
    }
    const entry = studentMap.get(g.student_id)!;
    entry.sum += g.total_marks;
    entry.count++;
  });

  const studentIdToName = new Map(students.map((s) => [s.id, s.name]));

  return Array.from(studentMap.entries())
    .map(([studentId, data]) => ({
      studentId,
      studentName: studentIdToName.get(studentId) || "Unknown",
      averageScore: data.count > 0 ? Math.round(data.sum / data.count) : 0,
      gradeCount: data.count,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);
}

// Compute grade distribution
export function computeGradeDistribution(studentScores: StudentScore[]): {
  range: string;
  count: number;
}[] {
  const scores = studentScores.map((s) => s.averageScore);
  return [
    { range: "A*", count: scores.filter((g) => g >= 90).length },
    { range: "A", count: scores.filter((g) => g >= 80 && g < 90).length },
    { range: "B", count: scores.filter((g) => g >= 70 && g < 80).length },
    { range: "C", count: scores.filter((g) => g >= 60 && g < 70).length },
    { range: "D", count: scores.filter((g) => g >= 50 && g < 60).length },
    { range: "E", count: scores.filter((g) => g < 50).length },
  ];
}

// Compute grade distribution for a single subject
export function computeSingleSubjectDistribution(
  grades: SubjectGrade[],
  students: ClassAnalysisStudent[],
  subjectId: number
): {
  distribution: { range: string; count: number }[];
  rankedStudents: { studentId: string; studentName: string; score: number }[];
} {
  const subjectGrades = grades.filter((g) => g.subject_id === subjectId);
  const studentIdToName = new Map(students.map((s) => [s.id, s.name]));
  
  // Get scores per student for the subject
  const studentScores: { studentId: string; studentName: string; score: number }[] = [];
  subjectGrades.forEach((g) => {
    studentScores.push({
      studentId: g.student_id,
      studentName: studentIdToName.get(g.student_id) || "Unknown",
      score: g.total_marks,
    });
  });
  
  // Sort by score descending
  studentScores.sort((a, b) => b.score - a.score);
  
  // Compute distribution
  const scores = studentScores.map((s) => s.score);
  const distribution = [
    { range: "A*", count: scores.filter((g) => g >= 90).length },
    { range: "A", count: scores.filter((g) => g >= 80 && g < 90).length },
    { range: "B", count: scores.filter((g) => g >= 70 && g < 80).length },
    { range: "C", count: scores.filter((g) => g >= 60 && g < 70).length },
    { range: "D", count: scores.filter((g) => g >= 50 && g < 60).length },
    { range: "E", count: scores.filter((g) => g < 50).length },
  ];
  
  return { distribution, rankedStudents: studentScores };
}

// Compute subject changes between two periods (for Rising/At-Risk)
export function computeSubjectChanges(
  grades: SubjectGrade[],
  subjects: SubjectInfo[],
  periodA: string,
  periodB: string,
  selectedSubjectIds: number[]
): { rising: SubjectChange[]; falling: SubjectChange[] } {
  const subjectAvgByPeriod = new Map<
    number,
    { periodA: number | null; periodB: number | null }
  >();

  grades.forEach((g) => {
    if (
      selectedSubjectIds.length > 0 &&
      !selectedSubjectIds.includes(g.subject_id)
    ) {
      return;
    }
    if (g.academic_period_id !== periodA && g.academic_period_id !== periodB) {
      return;
    }
    if (!subjectAvgByPeriod.has(g.subject_id)) {
      subjectAvgByPeriod.set(g.subject_id, { periodA: null, periodB: null });
    }
  });

  // Actually compute averages per period
  const periodAGrades = grades.filter((g) => g.academic_period_id === periodA);
  const periodBGrades = grades.filter((g) => g.academic_period_id === periodB);

  const computeAvg = (
    gradeList: SubjectGrade[]
  ): Map<number, { sum: number; count: number }> => {
    const map = new Map<number, { sum: number; count: number }>();
    gradeList.forEach((g) => {
      if (
        selectedSubjectIds.length > 0 &&
        !selectedSubjectIds.includes(g.subject_id)
      ) {
        return;
      }
      if (!map.has(g.subject_id)) {
        map.set(g.subject_id, { sum: 0, count: 0 });
      }
      const e = map.get(g.subject_id)!;
      e.sum += g.total_marks;
      e.count++;
    });
    return map;
  };

  const avgA = computeAvg(periodAGrades);
  const avgB = computeAvg(periodBGrades);

  const subjectIdToName = new Map(subjects.map((s) => [s.id, s.name]));

  // Merge
  const allSubjectIds = new Set([...avgA.keys(), ...avgB.keys()]);
  const changes: SubjectChange[] = [];

  allSubjectIds.forEach((subjectId) => {
    const dataA = avgA.get(subjectId);
    const dataB = avgB.get(subjectId);
    const firstAvg = dataA && dataA.count > 0 ? dataA.sum / dataA.count : null;
    const lastAvg = dataB && dataB.count > 0 ? dataB.sum / dataB.count : null;

    if (firstAvg !== null && lastAvg !== null) {
      changes.push({
        name: subjectIdToName.get(subjectId) || `Subject ${subjectId}`,
        first: Math.round(firstAvg),
        last: Math.round(lastAvg),
        change: Math.round(lastAvg - firstAvg),
      });
    }
  });

  const rising = changes
    .filter((c) => c.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 3);

  const falling = changes
    .filter((c) => c.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 3)
    .map((c) => ({ ...c, change: Math.abs(c.change) }));

  return { rising, falling };
}

// Compute summary stats
export function computeSummaryStats(
  studentScores: StudentScore[],
  passMark: number = 50,
  rosterCount?: number
): {
  classAverage: number;
  passCount: number;
  passRate: number;
  studentCount: number;
  gradedStudentCount: number;
} {
  const gradedStudentCount = studentScores.length;
  if (gradedStudentCount === 0) {
    return {
      classAverage: 0,
      passCount: 0,
      passRate: 0,
      studentCount: rosterCount ?? 0,
      gradedStudentCount,
    };
  }

  const totalScore = studentScores.reduce((sum, s) => sum + s.averageScore, 0);
  const classAverage = Math.round(totalScore / gradedStudentCount);
  const passCount = studentScores.filter((s) => s.averageScore >= passMark)
    .length;
  const passRate = Math.round((passCount / gradedStudentCount) * 100);

  return {
    classAverage,
    passCount,
    passRate,
    studentCount: rosterCount ?? gradedStudentCount,
    gradedStudentCount,
  };
}

// Compute trend data across multiple periods
export function computeTrendData(
  grades: SubjectGrade[],
  subjects: SubjectInfo[],
  academicPeriods: AcademicPeriodInfo[],
  selectedSubjectIds: number[]
): { period: string; periodId: string; [key: string]: number | string }[] {
  // Group grades by academic period
  const periodData = new Map<string, Map<number, { sum: number; count: number }>>();
  
  grades.forEach((g) => {
    if (selectedSubjectIds.length > 0 && !selectedSubjectIds.includes(g.subject_id)) {
      return;
    }
    
    if (!periodData.has(g.academic_period_id)) {
      periodData.set(g.academic_period_id, new Map());
    }
    const subjectMap = periodData.get(g.academic_period_id)!;
    
    if (!subjectMap.has(g.subject_id)) {
      subjectMap.set(g.subject_id, { sum: 0, count: 0 });
    }
    const entry = subjectMap.get(g.subject_id)!;
    entry.sum += g.total_marks;
    entry.count++;
  });
  
  const subjectIdToName = new Map(subjects.map((s) => [s.id, s.name]));
  
  // Sort periods by their order
  const orderedPeriods = academicPeriods
    .filter((p) => periodData.has(p.id))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  return orderedPeriods.map((period) => {
    const subjectMap = periodData.get(period.id) || new Map();
    const result: { period: string; periodId: string; [key: string]: number | string } = {
      period: period.name,
      periodId: period.id,
    };
    
    let totalScore = 0;
    let subjectCount = 0;
    
    subjectMap.forEach((data, subjectId) => {
      const avg = data.count > 0 ? Math.round(data.sum / data.count) : 0;
      const subjectName = subjectIdToName.get(subjectId) || `Subject ${subjectId}`;
      result[subjectName] = avg;
      totalScore += avg;
      subjectCount++;
    });
    
    result["Average"] = subjectCount > 0 ? Math.round(totalScore / subjectCount) : 0;
    return result;
  });
}

// Compute box plot statistics for a single subject
export interface BoxPlotStats {
  subjectName: string;
  subjectId: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  count: number;
  outliers: number[];
}

export function computeBoxPlotStats(
  grades: SubjectGrade[],
  subjects: SubjectInfo[],
  selectedSubjectIds: number[]
): BoxPlotStats[] {
  const subjectIdToName = new Map(subjects.map((s) => [s.id, s.name]));
  const subjectScores = new Map<number, number[]>();
  
  grades.forEach((g) => {
    if (selectedSubjectIds.length > 0 && !selectedSubjectIds.includes(g.subject_id)) {
      return;
    }
    
    if (!subjectScores.has(g.subject_id)) {
      subjectScores.set(g.subject_id, []);
    }
    subjectScores.get(g.subject_id)!.push(g.total_marks);
  });
  
  const results: BoxPlotStats[] = [];
  
  subjectScores.forEach((scores, subjectId) => {
    if (scores.length === 0) return;
    
    // Sort scores
    const sorted = [...scores].sort((a, b) => a - b);
    const n = sorted.length;
    
    const getPercentile = (arr: number[], p: number): number => {
      const index = (p / 100) * (arr.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      if (lower === upper) return arr[lower];
      return arr[lower] * (upper - index) + arr[upper] * (index - lower);
    };
    
    const min = sorted[0];
    const max = sorted[n - 1];
    const q1 = getPercentile(sorted, 25);
    const median = getPercentile(sorted, 50);
    const q3 = getPercentile(sorted, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers = sorted.filter((s) => s < lowerBound || s > upperBound);
    
    results.push({
      subjectName: subjectIdToName.get(subjectId) || `Subject ${subjectId}`,
      subjectId,
      min,
      q1: Math.round(q1),
      median: Math.round(median),
      q3: Math.round(q3),
      max,
      count: n,
      outliers,
    });
  });
  
  return results.sort((a, b) => b.median - a.median);
}
