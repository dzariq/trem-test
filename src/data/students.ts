import { supabase } from "@/lib/supabase";
import { getMyProfile } from "@/data/profile";

export type LinkedStudent = {
  id: string;
  studentId?: string;
  name: string;
  classLabel?: string | null;
  className?: string | null;
  grade?: string | null;
  sportsHouse?: string | null;
  mealPlan?: boolean | null;
  subjects?: string[] | null;
  relationship?: string | null;
  isPrimary?: boolean | null;
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
    name: name || "Student",
    className: row.class_name ?? row.class ?? row.classroom ?? null,
    grade: row.grade ?? row.year_group ?? row.level ?? null,
    sportsHouse: row.sports_house ?? row.house ?? null,
    mealPlan: row.meal_plan ?? row.has_meal_plan ?? null,
    subjects: row.subjects ?? row.subject_list ?? null,
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
    console.error("[students] student_guardians error:", error);
    if (
      isMissingResource(error, "student_guardians") ||
      isMissingResource(error, "guardian_user_id") ||
      isMissingResource(error, "student_id")
    ) {
      return [];
    }
    throw new Error(error.message);
  }

  console.log("[students] auth.uid():", guardianUserId);
  console.log("[students] student_guardians rows:", (data ?? []).length);
  console.log("[students] student_guardians sample:", data?.[0] ?? null);

  const studentIds = (data ?? [])
    .map((row: any) => row.student_id)
    .filter((id: any) => id !== null && id !== undefined);

  if (studentIds.length === 0) {
    return [];
  }

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, name, year_level, class, campus_id, family_id")
    .in("id", studentIds as any[]);

  if (studentsError) {
    console.error("[students] students error:", studentsError);
    throw new Error(studentsError.message);
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
      const classLabel = [student.class, student.year_level]
        .filter(Boolean)
        .map(String)
        .join(" - ");

      return {
        id: String(student.id),
        studentId: String(student.id),
        name: name || "Student",
        classLabel: classLabel || null,
        className: student.class ?? null,
        grade: student.year_level ?? null,
        relationship: link.relationship ?? null,
        isPrimary: link.is_primary ?? null,
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
