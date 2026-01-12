import { supabase } from "@/lib/supabase";
import { getMyProfile } from "@/data/profile";

export type MonthlyAttendanceSummary = {
  month: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

const isMissingResource = (error: { message?: string } | null, keyword: string) => {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  return message.includes("does not exist") && message.includes(keyword.toLowerCase());
};

export async function listMonthlyAttendanceSummary(): Promise<MonthlyAttendanceSummary[]> {
  const profile = await getMyProfile();

  const { data, error } = await supabase
    .from("attendance_summary")
    .select("*")
    .eq("user_id", profile.user_id);

  if (error) {
    if (isMissingResource(error, "attendance_summary") || isMissingResource(error, "user_id")) {
      // TODO: Implement attendance summary table (attendance_summary) with user_id/month/status counts.
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row: any) => ({
    month: row.month ?? row.month_label ?? "",
    present: Number(row.present ?? 0),
    absent: Number(row.absent ?? 0),
    late: Number(row.late ?? 0),
    excused: Number(row.excused ?? 0),
  }));
}
