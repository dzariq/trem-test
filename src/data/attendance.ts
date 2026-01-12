// This file is deprecated for homepage attendance summary.
// Use useStudentAttendanceSummary hook instead which queries public.attendance directly.
// Keeping this file for backwards compatibility only.

export type MonthlyAttendanceSummary = {
  month: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
};

/**
 * @deprecated Use useStudentAttendanceSummary hook instead.
 * This function is kept for backwards compatibility but returns empty data.
 */
export async function listMonthlyAttendanceSummary(): Promise<MonthlyAttendanceSummary[]> {
  console.warn("listMonthlyAttendanceSummary is deprecated. Use useStudentAttendanceSummary hook instead.");
  return [];
}
