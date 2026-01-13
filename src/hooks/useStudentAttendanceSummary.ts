import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, subDays, eachMonthOfInterval } from "date-fns";

type AttendanceRow = { date: string; status: string };

function normalizeStatus(status: string): "present" | "absent" | "late" | "excused" | null {
  const lower = status.toLowerCase().trim();
  if (lower === "present") return "present";
  if (lower === "absent") return "absent";
  if (lower === "late") return "late";
  if (lower === "excused") return "excused";
  return null;
}

export function useStudentAttendanceSummary(studentId: string | null, days: number = 30) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startDate = useMemo(() => format(subDays(new Date(), days), "yyyy-MM-dd"), [days]);
  const endDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  useEffect(() => {
    if (!studentId) {
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
        .eq("student_id", studentId)
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
  }, [studentId, startDate, endDate]);

  const totals = useMemo(() => {
    const result = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    for (const row of rows) {
      const normalized = normalizeStatus(row.status);
      if (normalized) {
        result[normalized]++;
        result.total++;
      }
    }
    return result;
  }, [rows]);

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
      const monthKey = row.date.substring(0, 7);
      const bucket = bucketMap.get(monthKey);
      if (!bucket) continue;

      const normalized = normalizeStatus(row.status);
      if (normalized) bucket[normalized]++;
    }

    return Array.from(bucketMap.values());
  }, [rows, days]);

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
