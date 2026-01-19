import { supabase } from "@/lib/supabase";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceRecord = {
  id: string;
  student_id: string;
  class: string;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  student_name?: string | null;
};

export type StudentForAttendance = {
  id: string;
  name: string;
  class: string;
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

/**
 * Fetch students for a given class
 */
export async function fetchStudentsByClass(className: string): Promise<StudentForAttendance[]> {
  const { data, error } = await supabase
    .from("students")
    .select("id, name, class")
    .eq("class", className)
    .eq("archived", false)
    .order("name", { ascending: true });

  if (error) {
    logSupabaseError("teacherAttendance/fetchStudentsByClass", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    class: row.class,
  }));
}

/**
 * Fetch existing attendance records for a class on a specific date
 */
export async function fetchAttendanceForClassDate(
  className: string,
  date: string
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("class", className)
    .eq("date", date);

  if (error) {
    logSupabaseError("teacherAttendance/fetchAttendanceForClassDate", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    student_id: row.student_id,
    class: row.class,
    date: row.date,
    status: row.status as AttendanceStatus,
    remarks: row.remarks,
    student_name: row.student_name,
  }));
}

/**
 * Save attendance records (upsert behavior)
 * For each student: if record exists for (student_id, class, date), update it; otherwise insert.
 */
export async function saveAttendance(
  className: string,
  date: string,
  records: { student_id: string; student_name: string; status: AttendanceStatus; remarks?: string }[]
): Promise<void> {
  if (records.length === 0) return;

  // Fetch existing records to determine which to update vs insert
  const existing = await fetchAttendanceForClassDate(className, date);
  const existingMap = new Map(existing.map((r) => [r.student_id, r]));

  const toUpdate: { id: string; status: AttendanceStatus; remarks: string | null; student_name: string }[] = [];
  const toInsert: { student_id: string; class: string; date: string; status: AttendanceStatus; remarks: string | null; student_name: string }[] = [];

  for (const record of records) {
    const existingRecord = existingMap.get(record.student_id);
    if (existingRecord) {
      // Update existing
      toUpdate.push({
        id: existingRecord.id,
        status: record.status,
        remarks: record.remarks ?? null,
        student_name: record.student_name,
      });
    } else {
      // Insert new
      toInsert.push({
        student_id: record.student_id,
        class: className,
        date: date,
        status: record.status,
        remarks: record.remarks ?? null,
        student_name: record.student_name,
      });
    }
  }

  // Perform updates
  for (const update of toUpdate) {
    const { error } = await supabase
      .from("attendance")
      .update({
        status: update.status,
        remarks: update.remarks,
        student_name: update.student_name,
      })
      .eq("id", update.id);

    if (error) {
      logSupabaseError("teacherAttendance/update", error);
      throw new Error(`Failed to update attendance: ${error.message}`);
    }
  }

  // Perform inserts
  if (toInsert.length > 0) {
    const { error } = await supabase.from("attendance").insert(toInsert);

    if (error) {
      logSupabaseError("teacherAttendance/insert", error);
      throw new Error(`Failed to insert attendance: ${error.message}`);
    }
  }
}

/**
 * Fetch unique classes from students table (for teacher class selection)
 * In production, this should be filtered by teacher's assigned classes
 */
export async function fetchAvailableClasses(): Promise<string[]> {
  const { data, error } = await supabase
    .from("students")
    .select("class")
    .eq("archived", false);

  if (error) {
    logSupabaseError("teacherAttendance/fetchAvailableClasses", error);
    throw new Error(error.message);
  }

  // Get unique classes
  const classSet = new Set<string>();
  (data ?? []).forEach((row) => {
    if (row.class) {
      classSet.add(row.class);
    }
  });

  return Array.from(classSet).sort();
}
