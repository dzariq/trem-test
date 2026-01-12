import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, subDays, startOfMonth, eachMonthOfInterval } from "date-fns";

export type AttendanceTotals = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
};

export type MonthlyBucket = {
  month: string; // "Jan", "Feb", etc.
  monthKey: string; // "2026-01"
  present: number;
  absent: number;
  late: number;
  excused: number;
};

type AttendanceRow = {
  date: string;
  status: string;
};

function normalizeStatus(status: string): "present" | "absent" | "late" | "excused" | null {
  const lower = status.toLowerCase().trim();
  if (lower === "present") return "present";
  if (lower === "absent") return "absent";
  if (lower === "late") return "late";
  if (lower === "excused") return "excused";
  return null;
}

export function useStudentAttendanceSummary(
  studentId: string | null,
  days: number = 30
) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const start = subDays(today, days);
    return format(start, "yyyy-MM-dd");
  }, [today, days]);
  const endDate = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  useEffect(() => {
    if (!studentId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("attendance")
          .select("date, status")
          .eq("student_id", studentId)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true });

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (isMounted) {
          setRows((data as AttendanceRow[]) ?? []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load attendance.";
        if (isMounted) {
          setError(message);
          setRows([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAttendance();
    return () => {
      isMounted = false;
    };
  }, [studentId, startDate, endDate]);

  const totals: AttendanceTotals = useMemo(() => {
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

  const monthlyBuckets: MonthlyBucket[] = useMemo(() => {
    if (rows.length === 0) return [];

    // Create a map for all months in the range
    const start = subDays(today, days);
    const monthsInRange = eachMonthOfInterval({ start, end: today });
    
    const bucketMap = new Map<string, MonthlyBucket>();
    for (const monthDate of monthsInRange) {
      const monthKey = format(monthDate, "yyyy-MM");
      const monthLabel = format(monthDate, "MMM");
      bucketMap.set(monthKey, {
        month: monthLabel,
        monthKey,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      });
    }

    // Populate buckets from rows
    for (const row of rows) {
      const monthKey = row.date.substring(0, 7); // "2026-01"
      const bucket = bucketMap.get(monthKey);
      if (bucket) {
        const normalized = normalizeStatus(row.status);
        if (normalized) {
          bucket[normalized]++;
        }
      }
    }

    return Array.from(bucketMap.values());
  }, [rows, today, days]);

  const chartData = useMemo(() => {
    return monthlyBuckets.map((bucket) => ({
      name: bucket.month,
      present: bucket.present,
      absent: bucket.absent,
      late: bucket.late,
      excused: bucket.excused,
    }));
  }, [monthlyBuckets]);

  return {
    rows,
    totals,
    monthlyBuckets,
    chartData,
    loading,
    error,
    debug: {
      studentId,
      startDate,
      endDate,
      rowsCount: rows.length,
    },
  };
}
