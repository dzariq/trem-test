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
  const { data, error } = await supabase
    .from("class_years")
    .select("id")
    .eq("class_name", className)
    .maybeSingle();

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
      inputs[student.id] = {
        attitude: existing.attitude_marks?.toString() || "",
        homework: existing.homework_marks?.toString() || "",
        quiz: existing.quiz_marks?.toString() || "",
        exam: existing.exam_marks?.toString() || "",
        reportComment: existing.teacher_comment || "",
        studyRecommendation: existing.subject_comment || "",
        comment: existing.teacher_comment || "",
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

// Fetch subjects (optionally filter by year level)
export async function fetchSubjects(yearLevel?: string): Promise<SubjectInfo[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, code, year_levels")
    .order("name");

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

// Calculate letter grade from total
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
  // because total_marks is a generated column in Supabase (computed automatically)
  // and letter_grade may also be computed. Sending them causes a 400 error.
  const updates: Array<{
    id?: string;
    student_id: string;
    subject_id: number;
    academic_period_id: string;
    attitude_marks: number;
    homework_marks: number;
    quiz_marks: number;
    exam_marks: number;
    teacher_comment: string | null;
    subject_comment: string | null;
  }> = [];

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

    // Record WITHOUT generated columns (total_marks, letter_grade)
    const record = {
      student_id: grade.studentId,
      subject_id: grade.subjectId,
      academic_period_id: grade.academicPeriodId,
      attitude_marks: attitude,
      homework_marks: homework,
      quiz_marks: quiz,
      exam_marks: exam,
      teacher_comment: grade.gradeInput.reportComment || grade.gradeInput.comment || null,
      subject_comment: grade.gradeInput.studyRecommendation || null,
    };

    if (grade.existingGradeId) {
      updates.push({ id: grade.existingGradeId, ...record });
    } else {
      updates.push(record);
    }
  }

  if (updates.length === 0) {
    return { success: true };
  }

  // Separate updates and inserts
  const toUpdate = updates.filter(u => u.id);
  const toInsert = updates.filter(u => !u.id);

  try {
    // Process updates
    for (const update of toUpdate) {
      const { id, ...data } = update;
      const { error } = await supabase
        .from("student_grades")
        .update(data)
        .eq("id", id);

      if (error) {
        logSupabaseError("gradeEntry/saveGrades/update", error);
        return { success: false, error: error.message };
      }
    }

    // Process inserts
    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("student_grades")
        .insert(toInsert);

      if (error) {
        logSupabaseError("gradeEntry/saveGrades/insert", error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error("[gradeEntry/saveGrades]", err);
    return { success: false, error: String(err) };
  }
}

// Fetch class recommendation (using grade_configurations additional_columns or a simple approach)
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
