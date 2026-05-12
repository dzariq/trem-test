import { supabase } from "@/lib/supabase";

// Types
export interface GradeEntryStudent {
  id: string;
  name: string;
  class: string;
  year_level: string;
}

export interface SubjectInfo {
  id: number;
  name: string;
  code: string | null;
  year_levels: string[] | null;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  is_open_for_grading: boolean;
  academic_year: number | null;
}

export interface StudentGradeRecord {
  id: string;
  student_id: string;
  subject_id: number;
  academic_period_id: string;
  attitude_marks: number;
  homework_marks: number;
  quiz_marks: number;
  exam_marks: number;
  total_marks: number | null;
  letter_grade: string | null;
  teacher_comment: string | null;
  subject_comment: string | null;
  study_recommendation: string | null;
  updated_at: string;
}

export interface ClassStudyRecommendationRecord {
  class_year_id: number;
  subject_id: number;
  academic_period_id: string;
  recommendation: string;
  updated_at: string;
}

export interface GradeInput {
  attitude: string;
  homework: string;
  quiz: string;
  exam: string;
  reportComment: string;
  studyRecommendation: string;
  comment: string;
}

export interface GradeEntryStats {
  graded: number;
  pending: number;
  total: number;
  average: number;
}

export const emptyGradeInput: GradeInput = {
  attitude: "",
  homework: "",
  quiz: "",
  exam: "",
  reportComment: "",
  studyRecommendation: "",
  comment: "",
};

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

const fetchClassYearId = async (className: string): Promise<number | null> => {
  const raw = (className || "").trim();
  if (!raw) return null;

  // class_years.class_name stores the campus-prefixed name (e.g. "BO-Y9I").
  // Try the raw value first; if the caller passed a stripped/display name
  // (e.g. "Y9I"), fall back to matching the suffix across campuses.
  let { data, error } = await supabase
    .from("class_years")
    .select("id, class_name")
    .eq("class_name", raw)
    .maybeSingle();

  if (!error && !data && !/^(BO|GL)-/i.test(raw)) {
    const res = await supabase
      .from("class_years")
      .select("id, class_name")
      .or(`class_name.eq.BO-${raw},class_name.eq.GL-${raw}`)
      .limit(1)
      .maybeSingle();
    data = res.data as any;
    error = res.error;
  }

  if (error) {
    logSupabaseError("gradeEntry/fetchClassYearId", error);
    return null;
  }

  return data?.id ?? null;
};

export function buildGradeInputsFromExistingGrades(
  students: GradeEntryStudent[],
  existingGrades: Map<string, StudentGradeRecord>
): Record<string, GradeInput> {
  const inputs: Record<string, GradeInput> = {};
  students.forEach((student) => {
    const existing = existingGrades.get(student.id);
    if (existing) {
      // Backward-compat: legacy rows stored study recommendation in subject_comment
      // because the dedicated study_recommendation column was not being written to.
      // - If study_recommendation is set: use it; subject_comment becomes the general comment.
      // - If study_recommendation is NULL: treat subject_comment as the legacy study recommendation
      //   to avoid losing existing data, and leave general comment blank.
      const hasNewStudyRec =
        existing.study_recommendation !== null && existing.study_recommendation !== undefined;
      inputs[student.id] = {
        attitude: existing.attitude_marks?.toString() || "",
        homework: existing.homework_marks?.toString() || "",
        quiz: existing.quiz_marks?.toString() || "",
        exam: existing.exam_marks?.toString() || "",
        reportComment: existing.teacher_comment || "",
        studyRecommendation: hasNewStudyRec
          ? (existing.study_recommendation as string)
          : (existing.subject_comment || ""),
        comment: hasNewStudyRec ? (existing.subject_comment || "") : "",
      };
    } else {
      inputs[student.id] = { ...emptyGradeInput };
    }
  });
  return inputs;
}

export function computeGradeEntryStats(
  students: GradeEntryStudent[],
  gradeInputs: Record<string, GradeInput>
): GradeEntryStats {
  const total = students.length;
  let graded = 0;
  let totalScore = 0;

  students.forEach((student) => {
    const input = gradeInputs[student.id];
    if (input) {
      const hasData = input.attitude || input.homework || input.quiz || input.exam;
      if (hasData) {
        graded++;
        const score =
          (parseInt(input.attitude) || 0) +
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
    average: graded > 0 ? Math.round(totalScore / graded) : 0,
  };
}

// Fetch available classes (distinct from students table)
export async function fetchAvailableClasses(): Promise<string[]> {
  const { data, error } = await supabase
    .from("students")
    .select("class")
    .eq("archived", false)
    .not("class", "eq", "")
    .order("class");

  if (error) {
    logSupabaseError("gradeEntry/fetchAvailableClasses", error);
    throw error;
  }

  // Get unique classes
  const uniqueClasses = [...new Set(data?.map(s => s.class).filter(Boolean))];
  return uniqueClasses;
}

// Fetch students for a specific class
export async function fetchStudentsByClass(className: string): Promise<GradeEntryStudent[]> {
  const { data, error } = await supabase
    .from("students")
    .select("id, name, class, year_level")
    .eq("class", className)
    .eq("archived", false)
    .order("name");

  if (error) {
    logSupabaseError("gradeEntry/fetchStudentsByClass", error);
    throw error;
  }

  return data || [];
}

// Fetch subjects (optionally filter by year level and campus code)
export async function fetchSubjects(
  yearLevel?: string,
  campusCode?: string | null,
): Promise<SubjectInfo[]> {
  let query = supabase
    .from("subjects")
    .select("id, name, code, year_levels, campus_code")
    .order("name");

  if (campusCode) {
    query = query.or(`campus_code.eq.${campusCode},campus_code.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseError("gradeEntry/fetchSubjects", error);
    throw error;
  }

  // Filter by year level if provided
  if (yearLevel && data) {
    return data.filter(subject => {
      if (!subject.year_levels || subject.year_levels.length === 0) return true;
      return subject.year_levels.some(yl => yearLevel.toUpperCase().includes(yl.toUpperCase()));
    });
  }

  return data || [];
}

// Fetch active academic periods
export async function fetchAcademicPeriods(): Promise<AcademicPeriod[]> {
  const { data, error } = await supabase
    .from("academic_periods")
    .select("id, name, code, is_active, is_open_for_grading, academic_year")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    logSupabaseError("gradeEntry/fetchAcademicPeriods", error);
    throw error;
  }

  return data || [];
}

// Fetch existing grades for a class + subject + academic period
export async function fetchExistingGrades(
  studentIds: string[],
  subjectId: number,
  academicPeriodId: string
): Promise<Map<string, StudentGradeRecord>> {
  if (studentIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("student_grades")
    .select("*")
    .in("student_id", studentIds)
    .eq("subject_id", subjectId)
    .eq("academic_period_id", academicPeriodId);

  if (error) {
    logSupabaseError("gradeEntry/fetchExistingGrades", error);
    throw error;
  }

  const gradesMap = new Map<string, StudentGradeRecord>();
  data?.forEach(grade => {
    gradesMap.set(grade.student_id, grade);
  });

  return gradesMap;
}

// Calculate letter grade from total.
// MUST stay in sync with the GENERATED expression on
// public.student_grades.letter_grade (A*/A/B/C/D/E scale, used everywhere
// in the UI: pill colors, badges, ReportCardDialog, ResultsSummary, etc.).
export function calculateLetterGrade(total: number): string {
  if (total >= 90) return "A*";
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  if (total >= 50) return "D";
  return "E";
}

// Save grades (upsert behavior)
export async function saveGrades(
  grades: Array<{
    studentId: string;
    subjectId: number;
    academicPeriodId: string;
    existingGradeId?: string;
    gradeInput: GradeInput;
  }>
): Promise<{ success: boolean; error?: string }> {
  // NOTE: We do NOT include total_marks or letter_grade in the payload
  // because they are computed by a BEFORE INSERT/UPDATE trigger
  // (student_grades_compute_totals) on the database side.
  const records: Array<{
    student_id: string;
    subject_id: number;
    academic_period_id: string;
    attitude_marks: number;
    homework_marks: number;
    quiz_marks: number;
    exam_marks: number;
    teacher_comment: string | null;
    subject_comment: string | null;
    study_recommendation: string | null;
  }> = [];

  // ---- Validation: catch invalid marks before hitting the network ----
  const invalidRows: string[] = [];
  const isValidMark = (raw: string): boolean => {
    if (raw === "" || raw === null || raw === undefined) return true;
    if (!/^\d+$/.test(raw.trim())) return false;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 && n <= 100;
  };

  for (const grade of grades) {
    const checks: Array<[string, string]> = [
      ["attitude", grade.gradeInput.attitude],
      ["homework", grade.gradeInput.homework],
      ["quiz", grade.gradeInput.quiz],
      ["exam", grade.gradeInput.exam],
    ];
    for (const [label, raw] of checks) {
      if (!isValidMark(raw)) {
        invalidRows.push(`Invalid ${label} mark: "${raw}" (must be 0-100)`);
      }
    }
  }

  if (invalidRows.length > 0) {
    return {
      success: false,
      error: invalidRows.slice(0, 3).join("; "),
    };
  }

  for (const grade of grades) {
    const attitude = parseInt(grade.gradeInput.attitude) || 0;
    const homework = parseInt(grade.gradeInput.homework) || 0;
    const quiz = parseInt(grade.gradeInput.quiz) || 0;
    const exam = parseInt(grade.gradeInput.exam) || 0;

    // Skip if no data entered
    if (attitude === 0 && homework === 0 && quiz === 0 && exam === 0 && 
        !grade.gradeInput.reportComment && !grade.gradeInput.studyRecommendation && !grade.gradeInput.comment) {
      continue;
    }

    // Record WITHOUT auto-computed columns (total_marks, letter_grade)
    records.push({
      student_id: grade.studentId,
      subject_id: grade.subjectId,
      academic_period_id: grade.academicPeriodId,
      attitude_marks: attitude,
      homework_marks: homework,
      quiz_marks: quiz,
      exam_marks: exam,
      // Map each UI field to its dedicated column (no more overloading).
      teacher_comment: grade.gradeInput.reportComment || null,
      study_recommendation: grade.gradeInput.studyRecommendation || null,
      subject_comment: grade.gradeInput.comment || null,
    });
  }

  if (records.length === 0) {
    return { success: true };
  }

  try {
    // Single atomic upsert on the unique key (student_id, subject_id, academic_period_id).
    // Replaces N round-trips and removes the race window that could create duplicates.
    const { error } = await supabase
      .from("student_grades")
      .upsert(records, {
        onConflict: "student_id,subject_id,academic_period_id",
      });

    if (error) {
      logSupabaseError("gradeEntry/saveGrades/upsert", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[gradeEntry/saveGrades]", err);
    return { success: false, error: String(err) };
  }
}

// Fetch class recommendation for a given class/subject/period.
export async function fetchClassStudyRecommendation(
  className: string,
  subjectId: number,
  academicPeriodId: string
): Promise<ClassStudyRecommendationRecord | null> {
  const classYearId = await fetchClassYearId(className);
  if (!classYearId) {
    return null;
  }

  const { data, error } = await supabase
    .from("class_study_recommendations")
    .select("class_year_id, subject_id, academic_period_id, recommendation, updated_at")
    .eq("class_year_id", classYearId)
    .eq("subject_id", subjectId)
    .eq("academic_period_id", academicPeriodId)
    .maybeSingle();

  if (error) {
    logSupabaseError("gradeEntry/fetchClassStudyRecommendation", error);
    return null;
  }

  return data ?? null;
}

// Save class recommendation
export async function saveClassStudyRecommendation(
  className: string,
  subjectId: number,
  academicPeriodId: string,
  recommendation: string
): Promise<{ success: boolean; record?: ClassStudyRecommendationRecord; error?: string }> {
  const classYearId = await fetchClassYearId(className);
  if (!classYearId) {
    return { success: false, error: "Unable to resolve class year." };
  }

  const { data, error } = await supabase
    .from("class_study_recommendations")
    .upsert(
      {
        class_year_id: classYearId,
        subject_id: subjectId,
        academic_period_id: academicPeriodId,
        recommendation,
      },
      { onConflict: "class_year_id,subject_id,academic_period_id" }
    )
    .select("class_year_id, subject_id, academic_period_id, recommendation, updated_at")
    .single();

  if (error) {
    logSupabaseError("gradeEntry/saveClassStudyRecommendation", error);
    return { success: false, error: error.message };
  }

  return { success: true, record: data ?? undefined };
}
