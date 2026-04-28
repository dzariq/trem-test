import { supabase } from "@/lib/supabase";
import { getMyProfile } from "@/data/profile";
import { stripCampusPrefix } from "@/lib/utils";

export type LinkedStudent = {
  id: string;
  studentId?: string;
  studentCode?: string | null;
  name: string;
  classLabel?: string | null;
  className?: string | null;
  grade?: string | null;
  campus?: string | null;
  campus_code?: string | null;
  sportsHouse?: string | null;
  mealPlan?: boolean | null;
  subjects?: string[] | null;
  relationship?: string | null;
  isPrimary?: boolean | null;
  ccaActivities?: { name: string; category: string | null }[];
  dob?: string | null;
  enrollmentDate?: string | null;
  graduationYear?: number | null;
};

const isMissingResource = (error: { message?: string } | null, keyword: string) => {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  return message.includes("does not exist") && message.includes(keyword.toLowerCase());
};

const mapStudentRow = (row: any): LinkedStudent => {
  const name =
    row.full_name ??
    row.name ??
    [row.first_name, row.last_name].filter(Boolean).join(" ").trim();

  return {
    id: String(row.id ?? row.student_id ?? row.user_id ?? ""),
    studentCode: row.student_code ?? null,
    name: name || "Student",
    className: stripCampusPrefix(row.class_name ?? row.class ?? row.classroom ?? ''),
    grade: row.grade ?? row.year_group ?? row.level ?? null,
    campus: row.campus ?? row.campus_id ?? null,
    sportsHouse: row.sports_house ?? row.house ?? null,
    mealPlan: row.meal_plan ?? row.has_meal_plan ?? null,
    subjects: row.subjects ?? row.subject_list ?? null,
    ccaActivities: [],
  };
};

const listStudentsByIds = async (studentIds: (string | number)[]) => {
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .in("id", studentIds as any[]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapStudentRow);
};

const listViaStudentGuardians = async (guardianUserId: string) => {
  const { data, error } = await supabase
    .from("student_guardians")
    .select("student_id, relationship, is_primary, created_at")
    .eq("guardian_user_id", guardianUserId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    if (
      isMissingResource(error, "student_guardians") ||
      isMissingResource(error, "guardian_user_id") ||
      isMissingResource(error, "student_id")
    ) {
      return [];
    }
    throw new Error(error.message);
  }

  const studentIds = (data ?? [])
    .map((row: any) => row.student_id)
    .filter((id: any) => id !== null && id !== undefined);

  if (studentIds.length === 0) {
    return [];
  }

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, name, year_level, class, campus_id, campus_code, family_id, student_code, dob, enrollment_date, graduation_year")
    .in("id", studentIds as any[]);

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  // Fetch sport houses for all students
  let sportHouseMap: Record<string, string> = {};
  try {
    const { data: sportData } = await supabase
      .from("student_sport_houses")
      .select("student_id, sport_house, assigned_at")
      .in("student_id", studentIds as any[])
      .order("assigned_at", { ascending: false });
    if (sportData) {
      for (const row of sportData) {
        // Take the first (latest) per student
        if (!sportHouseMap[String(row.student_id)]) {
          sportHouseMap[String(row.student_id)] = row.sport_house;
        }
      }
    }
  } catch {
    // Silently ignore if table doesn't exist or RLS blocks
  }

  // Fetch CCA enrollments for all students
  let ccaMap: Record<string, { name: string; category: string | null }[]> = {};
  try {
    const { data: ccaData } = await supabase
      .from("student_cca_enrollments")
      .select("student_id, status, cca_activities(name, category, is_active)")
      .in("student_id", studentIds as any[])
      .eq("status", "active");
    if (ccaData) {
      for (const row of ccaData as any[]) {
        if (row.cca_activities?.is_active === false) continue;
        const sid = String(row.student_id);
        if (!ccaMap[sid]) ccaMap[sid] = [];
        ccaMap[sid].push({
          name: row.cca_activities?.name || "Unknown",
          category: row.cca_activities?.category || null,
        });
      }
    }
  } catch {
    // Silently ignore
  }

  const studentMap = new Map(
    (students ?? []).map((student: any) => [String(student.id), student])
  );

  return (data ?? [])
    .map((link: any) => {
      const student = studentMap.get(String(link.student_id));
      if (!student) {
        return null;
      }
      const name =
        student.name ??
        student.full_name ??
        [student.first_name, student.last_name].filter(Boolean).join(" ").trim();
      const classLabel = [student.class ? stripCampusPrefix(student.class) : null, student.year_level]
        .filter(Boolean)
        .map(String)
        .join(" - ");

      return {
        id: String(student.id),
        studentId: String(student.id),
        studentCode: student.student_code ?? null,
        name: name || "Student",
        classLabel: classLabel || null,
        className: student.class ? stripCampusPrefix(student.class) : null,
        grade: student.year_level ?? null,
        campus: student.campus_id ?? null,
        campus_code: student.campus_code ?? null,
        sportsHouse: sportHouseMap[String(student.id)] ?? null,
        relationship: link.relationship ?? null,
        isPrimary: link.is_primary ?? null,
        ccaActivities: ccaMap[String(student.id)] ?? [],
      } as LinkedStudent;
    })
    .filter((student): student is LinkedStudent => Boolean(student));
};

const listViaStudentUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    if (isMissingResource(error, "user_id")) {
      return null;
    }
    throw new Error(error.message);
  }

  return (data ?? []).map(mapStudentRow);
};

export async function listMyLinkedStudents(): Promise<LinkedStudent[]> {
  const profile = await getMyProfile();
  const role = profile.role?.toLowerCase();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const authUserId = authData.user?.id ?? "";
  if (!authUserId) {
    return [];
  }

  if (role === "student") {
    const students = await listViaStudentUserId(authUserId);
    if (students) {
      return students;
    }
    return [];
  }

  if (role === "parent") {
    return listViaStudentGuardians(authUserId);
  }

  return [];
}
