import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, subDays, eachMonthOfInterval, parseISO } from "date-fns";
import { useResumeTick } from "@/hooks/useRefreshOnAppResume";
import { useAttendanceHolidaySet } from "@/hooks/useAttendanceHolidaySet";
import { isBlockedAttendanceDate } from "@/lib/attendanceCalendar";

type AttendanceRow = { date: string; status: string };

function normalizeStatus(status: string): "present" | "absent" | "late" | "excused" | null {
  const lower = status.toLowerCase().trim();
  if (lower === "present") return "present";
  if (lower === "absent") return "absent";
  if (lower === "late") return "late";
  if (lower === "excused") return "excused";
  return null;
}

export function useStudentAttendanceSummary(
  studentId: string | string[] | null,
  days: number = 30,
) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resumeTick = useResumeTick();

  const startDate = useMemo(() => format(subDays(new Date(), days), "yyyy-MM-dd"), [days]);
  const endDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const rangeStartDate = useMemo(() => subDays(new Date(), days), [days]);
  const rangeEndDate = useMemo(() => new Date(), []);
  const { holidaySet } = useAttendanceHolidaySet(rangeStartDate, rangeEndDate);

  const studentIds = useMemo(() => {
    if (!studentId) return [];
    return Array.isArray(studentId) ? studentId.filter(Boolean) : [studentId];
  }, [studentId]);
  const studentIdsKey = studentIds.join(",");

  useEffect(() => {
    if (studentIds.length === 0) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("attendance")
        .select("date, status")
        .in("student_id", studentIds)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      if (cancelled) return;

      if (queryError) {
        setError(queryError.message);
        setRows([]);
      } else {
        setRows((data as AttendanceRow[]) ?? []);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [studentIdsKey, startDate, endDate, resumeTick]);

  const totals = useMemo(() => {
    const result = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    for (const row of rows) {
      if (isBlockedAttendanceDate(parseISO(row.date), holidaySet)) continue;
      const normalized = normalizeStatus(row.status);
      if (normalized) {
        result[normalized]++;
        result.total++;
      }
    }
    return result;
  }, [rows, holidaySet]);

  const monthlyBuckets = useMemo(() => {
    if (rows.length === 0) return [];

    const today = new Date();
    const start = subDays(today, days);
    const monthsInRange = eachMonthOfInterval({ start, end: today });

    const bucketMap = new Map<string, any>();
    for (const monthDate of monthsInRange) {
      const monthKey = format(monthDate, "yyyy-MM");
      bucketMap.set(monthKey, {
        month: format(monthDate, "MMM"),
        monthKey,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      });
    }

    for (const row of rows) {
      if (isBlockedAttendanceDate(parseISO(row.date), holidaySet)) continue;
      const monthKey = row.date.substring(0, 7);
      const bucket = bucketMap.get(monthKey);
      if (!bucket) continue;

      const normalized = normalizeStatus(row.status);
      if (normalized) bucket[normalized]++;
    }

    return Array.from(bucketMap.values());
  }, [rows, days, holidaySet]);

  const chartData = useMemo(
    () =>
      monthlyBuckets.map((b: any) => ({
        name: b.month,
        present: b.present,
        absent: b.absent,
        late: b.late,
        excused: b.excused,
      })),
    [monthlyBuckets]
  );

  return { rows, totals, monthlyBuckets, chartData, loading, error };
}
