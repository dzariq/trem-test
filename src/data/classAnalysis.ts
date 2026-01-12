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

// Fetch distinct classes from students table
export async function fetchDistinctClasses(): Promise<string[]> {
  const { data, error } = await supabase
    .from("students")
    .select("class")
    .eq("archived", false)
    .not("class", "eq", "")
    .order("class");

  if (error) {
    console.error("Error fetching classes:", error);
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
    console.error("Error fetching students:", error);
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
    .select("id, name, code, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("Error fetching academic periods:", error);
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
    console.error("Error fetching grade subjects:", gradeError);
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
    console.error("Error fetching subjects:", subjectsError);
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
    console.error("Error fetching grades:", error);
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
  passMark: number = 50
): {
  classAverage: number;
  passCount: number;
  passRate: number;
  studentCount: number;
} {
  if (studentScores.length === 0) {
    return { classAverage: 0, passCount: 0, passRate: 0, studentCount: 0 };
  }

  const totalScore = studentScores.reduce((sum, s) => sum + s.averageScore, 0);
  const classAverage = Math.round(totalScore / studentScores.length);
  const passCount = studentScores.filter(
    (s) => s.averageScore >= passMark
  ).length;
  const passRate = Math.round((passCount / studentScores.length) * 100);

  return {
    classAverage,
    passCount,
    passRate,
    studentCount: studentScores.length,
  };
}
