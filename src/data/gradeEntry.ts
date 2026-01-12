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

// Fetch available classes (distinct from students table)
export async function fetchAvailableClasses(): Promise<string[]> {
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
    console.error("Error fetching students:", error);
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
    console.error("Error fetching subjects:", error);
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
    .select("id, name, code, is_active, is_open_for_grading")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("Error fetching academic periods:", error);
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
    console.error("Error fetching existing grades:", error);
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
  const updates: Array<{
    id?: string;
    student_id: string;
    subject_id: number;
    academic_period_id: string;
    attitude_marks: number;
    homework_marks: number;
    quiz_marks: number;
    exam_marks: number;
    total_marks: number;
    letter_grade: string;
    teacher_comment: string | null;
    subject_comment: string | null;
  }> = [];

  for (const grade of grades) {
    const attitude = parseInt(grade.gradeInput.attitude) || 0;
    const homework = parseInt(grade.gradeInput.homework) || 0;
    const quiz = parseInt(grade.gradeInput.quiz) || 0;
    const exam = parseInt(grade.gradeInput.exam) || 0;
    const total = attitude + homework + quiz + exam;

    // Skip if no data entered
    if (attitude === 0 && homework === 0 && quiz === 0 && exam === 0 && 
        !grade.gradeInput.reportComment && !grade.gradeInput.studyRecommendation) {
      continue;
    }

    const record = {
      student_id: grade.studentId,
      subject_id: grade.subjectId,
      academic_period_id: grade.academicPeriodId,
      attitude_marks: attitude,
      homework_marks: homework,
      quiz_marks: quiz,
      exam_marks: exam,
      total_marks: total,
      letter_grade: calculateLetterGrade(total),
      teacher_comment: grade.gradeInput.comment || null,
      subject_comment: grade.gradeInput.reportComment || null,
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
        console.error("Error updating grade:", error);
        return { success: false, error: error.message };
      }
    }

    // Process inserts
    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("student_grades")
        .insert(toInsert);

      if (error) {
        console.error("Error inserting grades:", error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Error saving grades:", err);
    return { success: false, error: String(err) };
  }
}

// Fetch class recommendation (using grade_configurations additional_columns or a simple approach)
export async function fetchClassRecommendation(
  className: string,
  yearLevel: string,
  subjectId: number,
  academicPeriodId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("grade_configurations")
    .select("additional_columns")
    .eq("class", className)
    .eq("year_level", yearLevel)
    .eq("subject_id", subjectId)
    .eq("academic_period_id", academicPeriodId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching class recommendation:", error);
    return null;
  }

  // Extract recommendation from additional_columns JSON if it exists
  const additionalColumns = data?.additional_columns as Record<string, unknown> | null;
  return additionalColumns?.study_recommendation as string | null;
}

// Save class recommendation
export async function saveClassRecommendation(
  className: string,
  yearLevel: string,
  subjectId: number,
  academicPeriodId: string,
  recommendation: string
): Promise<{ success: boolean; error?: string }> {
  // First check if a configuration exists
  const { data: existing, error: fetchError } = await supabase
    .from("grade_configurations")
    .select("id, additional_columns")
    .eq("class", className)
    .eq("year_level", yearLevel)
    .eq("subject_id", subjectId)
    .eq("academic_period_id", academicPeriodId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching existing config:", fetchError);
    return { success: false, error: fetchError.message };
  }

  const additionalColumns = {
    ...(existing?.additional_columns as Record<string, unknown> || {}),
    study_recommendation: recommendation
  };

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("grade_configurations")
      .update({ additional_columns: additionalColumns })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating class recommendation:", error);
      return { success: false, error: error.message };
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from("grade_configurations")
      .insert({
        class: className,
        year_level: yearLevel,
        subject_id: subjectId,
        academic_period_id: academicPeriodId,
        additional_columns: additionalColumns
      });

    if (error) {
      console.error("Error inserting class recommendation:", error);
      return { success: false, error: error.message };
    }
  }

  return { success: true };
}
