import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { useRefetchOnResume, useResumeTick } from "@/hooks/useRefreshOnAppResume";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

type AttendanceRecord = {
  id: string;
  student_id: string;
  student_name: string | null;
  class: string;
  date: string;
  status: string;
  remarks: string | null;
};

type MonthlyChartData = {
  month: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attended: number;
  totalDays: number;
  pct: number | null;
};

type DailyBreakdown = {
  date: string;
  status: string;
  reason: string | null;
  remarks: string | null;
};

type DebugInfo = {
  selectedStudentId: string | null;
  queryStart: string;
  queryEnd: string;
  rowsReturned: number;
  supabaseError: string | null;
  lastFetchTime: string;
};

/**
 * Get date range for a given year (yearly view)
 */
function getYearDateRange(year: string): { start: string; end: string } {
  const yearNum = parseInt(year, 10);
  return {
    start: `${yearNum}-01-01`,
    end: `${yearNum + 1}-01-01`, // exclusive end
  };
}

/**
 * Get rolling date range for last N months from TODAY
 */
function getRollingMonthsRange(months: number): { start: string; end: string } {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 1); // Start of next month
  const start = new Date(today.getFullYear(), today.getMonth() - months + 1, 1); // Start of N months ago

  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

type StudentIdInput = string | string[] | null;

function normalizeIds(input: StudentIdInput): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  return [input];
}

export function useParentAttendance(studentId: StudentIdInput, selectedYear: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    selectedStudentId: null,
    queryStart: "",
    queryEnd: "",
    rowsReturned: 0,
    supabaseError: null,
    lastFetchTime: "",
  });

  const ids = useMemo(() => normalizeIds(studentId), [studentId]);
  const idsKey = ids.join(",");

  // Fetch attendance data with proper date range filtering
  const fetchAttendance = useCallback(async () => {
    if (ids.length === 0) {
      setRecords([]);
      setDebugInfo((prev) => ({
        ...prev,
        selectedStudentId: null,
        rowsReturned: 0,
        supabaseError: null,
      }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getYearDateRange(selectedYear);

      console.log(`[attendance] Fetching for students=${idsKey}, range=${start} to ${end}`);

      const { data, error: fetchError } = await supabase
        .from("attendance")
        .select("id, student_id, student_name, class, date, status, remarks")
        .in("student_id", ids)
        .gte("date", start)
        .lt("date", end)
        .order("date", { ascending: false });

      // Update debug info
      setDebugInfo({
        selectedStudentId: idsKey,
        queryStart: start,
        queryEnd: end,
        rowsReturned: data?.length ?? 0,
        supabaseError: fetchError?.message ?? null,
        lastFetchTime: new Date().toISOString(),
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      console.log(`[attendance] Fetched ${data?.length ?? 0} rows`);
      setRecords(data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load attendance";
      setError(message);
      console.error("[attendance] Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, selectedYear]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useRefetchOnResume(fetchAttendance);

  // Calculate monthly chart data - normalize status to lowercase
  const chartData = useMemo<MonthlyChartData[]>(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthCounts: Record<string, { present: number; absent: number; late: number; excused: number }> = {};

    // Initialize all months
    monthNames.forEach((month) => {
      monthCounts[month] = { present: 0, absent: 0, late: 0, excused: 0 };
    });

    // Count records by month - NORMALIZE status to lowercase
    records.forEach((record) => {
      const date = new Date(record.date);
      const monthName = monthNames[date.getMonth()];
      const status = record.status.toLowerCase() as AttendanceStatus;

      if (monthCounts[monthName] && ["present", "absent", "late", "excused"].includes(status)) {
        monthCounts[monthName][status]++;
      }
    });

    return monthNames.map((month) => {
      const c = monthCounts[month];
      const attended = c.present + c.late;
      const totalDays = c.present + c.absent + c.late + c.excused;
      const pct = totalDays > 0 ? Math.round((attended / totalDays) * 100) : null;
      return { month, ...c, attended, totalDays, pct };
    });
  }, [records]);

  // Calculate monthly summary for selected month
  const getMonthlySummary = useCallback(
    (monthIndex: number) => {
      const monthRecords = records.filter((r) => {
        const date = new Date(r.date);
        return date.getMonth() === monthIndex;
      });

      return {
        present: monthRecords.filter((r) => r.status.toLowerCase() === "present").length,
        absent: monthRecords.filter((r) => r.status.toLowerCase() === "absent").length,
        late: monthRecords.filter((r) => r.status.toLowerCase() === "late").length,
        excused: monthRecords.filter((r) => r.status.toLowerCase() === "excused").length,
      };
    },
    [records]
  );

  // Get daily breakdown for selected month
  const getDailyBreakdown = useCallback(
    (monthIndex: number): DailyBreakdown[] => {
      return records
        .filter((r) => {
          const date = new Date(r.date);
          return date.getMonth() === monthIndex;
        })
        .map((r) => ({
          date: r.date,
          status: r.status.toLowerCase(),
          // Use the full remarks as the reason when present; drop fragile " - " split parsing
          reason: r.status.toLowerCase() !== "present" && r.remarks ? r.remarks : null,
          remarks: r.remarks,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [records]
  );

  // Refetch function for external use
  const refetch = useCallback(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  return {
    records,
    loading,
    error,
    chartData,
    getMonthlySummary,
    getDailyBreakdown,
    debugInfo,
    refetch,
  };
}

/**
 * Hook for rolling window attendance (3/6/12 months from TODAY)
 */
export function useRollingAttendance(studentId: StudentIdInput, months: 3 | 6 | 12) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resumeTick = useResumeTick();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    selectedStudentId: null,
    queryStart: "",
    queryEnd: "",
    rowsReturned: 0,
    supabaseError: null,
    lastFetchTime: "",
  });

  const ids = useMemo(() => normalizeIds(studentId), [studentId]);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (ids.length === 0) {
      setRecords([]);
      return;
    }

    const fetchRollingAttendance = async () => {
      setLoading(true);
      setError(null);

      try {
        const { start, end } = getRollingMonthsRange(months);

        console.log(`[attendance-rolling] Fetching for students=${idsKey}, months=${months}, range=${start} to ${end}`);

        const { data, error: fetchError } = await supabase
          .from("attendance")
          .select("id, student_id, student_name, class, date, status, remarks")
          .in("student_id", ids)
          .gte("date", start)
          .lt("date", end)
          .order("date", { ascending: true });

        setDebugInfo({
          selectedStudentId: idsKey,
          queryStart: start,
          queryEnd: end,
          rowsReturned: data?.length ?? 0,
          supabaseError: fetchError?.message ?? null,
          lastFetchTime: new Date().toISOString(),
        });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setRecords(data ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load attendance";
        setError(message);
        console.error("[attendance-rolling] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRollingAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, months, resumeTick]);

  // Group records by YYYY-MM for chart
  const chartData = useMemo<MonthlyChartData[]>(() => {
    const monthMap: Record<string, { present: number; absent: number; late: number; excused: number }> = {};

    records.forEach((record) => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { present: 0, absent: 0, late: 0, excused: 0 };
      }

      const status = record.status.toLowerCase() as AttendanceStatus;
      if (["present", "absent", "late", "excused"].includes(status)) {
        monthMap[monthKey][status]++;
      }
    });

    // Sort by date and convert to array
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, counts]) => {
        const [year, month] = key.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const attended = counts.present + counts.late;
        const totalDays = counts.present + counts.absent + counts.late + counts.excused;
        const pct = totalDays > 0 ? Math.round((attended / totalDays) * 100) : null;
        return {
          month: date.toLocaleDateString("en-US", { month: "short" }),
          ...counts,
          attended,
          totalDays,
          pct,
        };
      });
  }, [records]);

  // Total summary for the rolling period
  const summary = useMemo(() => {
    return {
      present: records.filter((r) => r.status.toLowerCase() === "present").length,
      absent: records.filter((r) => r.status.toLowerCase() === "absent").length,
      late: records.filter((r) => r.status.toLowerCase() === "late").length,
      excused: records.filter((r) => r.status.toLowerCase() === "excused").length,
    };
  }, [records]);

  return {
    records,
    loading,
    error,
    chartData,
    summary,
    debugInfo,
  };
}
