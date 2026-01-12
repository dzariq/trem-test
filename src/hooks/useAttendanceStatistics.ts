import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class: string;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  student_name?: string | null;
}

export interface MonthlyChartData {
  month: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export interface DailyBreakdown {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  students: { id: string; name: string; status: AttendanceStatus }[];
}

export interface StudentConcern {
  id: string;
  name: string;
  absent: number;
  late: number;
  totalDays: number;
  absentRate: number;
  lateRate: number;
}

interface UseAttendanceStatisticsProps {
  selectedClass: string;
  selectedYear: number;
  selectedMonth: number;
  concernsTimeRange: "week" | "month" | "custom";
  concernsCustomStartDate: Date;
  concernsCustomEndDate: Date;
}

export function useAttendanceStatistics({
  selectedClass,
  selectedYear,
  selectedMonth,
  concernsTimeRange,
  concernsCustomStartDate,
  concernsCustomEndDate,
}: UseAttendanceStatisticsProps) {
  const [yearlyData, setYearlyData] = useState<AttendanceRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<AttendanceRecord[]>([]);
  const [concernsData, setConcernsData] = useState<AttendanceRecord[]>([]);
  const [loadingYearly, setLoadingYearly] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingConcerns, setLoadingConcerns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch yearly data for chart
  useEffect(() => {
    if (!selectedClass) {
      setYearlyData([]);
      return;
    }

    const fetchYearlyData = async () => {
      setLoadingYearly(true);
      setError(null);

      try {
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;

        const { data, error: queryError } = await supabase
          .from("attendance")
          .select("*")
          .eq("class", selectedClass)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true });

        if (queryError) {
          console.error("[useAttendanceStatistics] yearly query error:", queryError);
          setError(queryError.message);
          return;
        }

        setYearlyData((data ?? []).map(row => ({
          id: row.id,
          student_id: row.student_id,
          class: row.class,
          date: row.date,
          status: row.status as AttendanceStatus,
          remarks: row.remarks,
          student_name: row.student_name,
        })));
      } catch (err) {
        console.error("[useAttendanceStatistics] yearly fetch error:", err);
        setError("Failed to fetch yearly data");
      } finally {
        setLoadingYearly(false);
      }
    };

    fetchYearlyData();
  }, [selectedClass, selectedYear]);

  // Fetch monthly data for daily breakdown
  useEffect(() => {
    if (!selectedClass) {
      setMonthlyData([]);
      return;
    }

    const fetchMonthlyData = async () => {
      setLoadingMonthly(true);

      try {
        const monthStart = new Date(selectedYear, selectedMonth, 1);
        const monthEnd = endOfMonth(monthStart);
        const startDateStr = format(monthStart, "yyyy-MM-dd");
        const endDateStr = format(monthEnd, "yyyy-MM-dd");

        const { data, error: queryError } = await supabase
          .from("attendance")
          .select("*")
          .eq("class", selectedClass)
          .gte("date", startDateStr)
          .lte("date", endDateStr)
          .order("date", { ascending: false });

        if (queryError) {
          console.error("[useAttendanceStatistics] monthly query error:", queryError);
          setError(queryError.message);
          return;
        }

        setMonthlyData((data ?? []).map(row => ({
          id: row.id,
          student_id: row.student_id,
          class: row.class,
          date: row.date,
          status: row.status as AttendanceStatus,
          remarks: row.remarks,
          student_name: row.student_name,
        })));
      } catch (err) {
        console.error("[useAttendanceStatistics] monthly fetch error:", err);
      } finally {
        setLoadingMonthly(false);
      }
    };

    fetchMonthlyData();
  }, [selectedClass, selectedYear, selectedMonth]);

  // Fetch concerns data based on time range
  useEffect(() => {
    if (!selectedClass) {
      setConcernsData([]);
      return;
    }

    const fetchConcernsData = async () => {
      setLoadingConcerns(true);

      try {
        let startDate: Date;
        let endDate: Date;

        if (concernsTimeRange === "week") {
          startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
          endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        } else if (concernsTimeRange === "month") {
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
        } else {
          startDate = concernsCustomStartDate;
          endDate = concernsCustomEndDate;
        }

        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");

        const { data, error: queryError } = await supabase
          .from("attendance")
          .select("*")
          .eq("class", selectedClass)
          .gte("date", startDateStr)
          .lte("date", endDateStr);

        if (queryError) {
          console.error("[useAttendanceStatistics] concerns query error:", queryError);
          return;
        }

        setConcernsData((data ?? []).map(row => ({
          id: row.id,
          student_id: row.student_id,
          class: row.class,
          date: row.date,
          status: row.status as AttendanceStatus,
          remarks: row.remarks,
          student_name: row.student_name,
        })));
      } catch (err) {
        console.error("[useAttendanceStatistics] concerns fetch error:", err);
      } finally {
        setLoadingConcerns(false);
      }
    };

    fetchConcernsData();
  }, [selectedClass, concernsTimeRange, concernsCustomStartDate, concernsCustomEndDate]);

  // Compute yearly chart data (grouped by month)
  const chartData = useMemo<MonthlyChartData[]>(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTotals: Record<number, { present: number; absent: number; late: number; excused: number }> = {};

    // Initialize all months
    for (let i = 0; i < 12; i++) {
      monthlyTotals[i] = { present: 0, absent: 0, late: 0, excused: 0 };
    }

    yearlyData.forEach(record => {
      const monthIndex = parseISO(record.date).getMonth();
      const status = record.status;
      if (monthlyTotals[monthIndex] && status in monthlyTotals[monthIndex]) {
        monthlyTotals[monthIndex][status as keyof typeof monthlyTotals[0]]++;
      }
    });

    return monthNames.map((month, index) => ({
      month,
      ...monthlyTotals[index],
    }));
  }, [yearlyData]);

  // Compute monthly summary
  const monthlySummary = useMemo(() => {
    const summary = { present: 0, absent: 0, late: 0, excused: 0 };
    monthlyData.forEach(record => {
      if (record.status in summary) {
        summary[record.status as keyof typeof summary]++;
      }
    });
    return summary;
  }, [monthlyData]);

  // Compute daily breakdown
  const dailyBreakdown = useMemo<DailyBreakdown[]>(() => {
    const byDate: Record<string, DailyBreakdown> = {};

    monthlyData.forEach(record => {
      if (!byDate[record.date]) {
        byDate[record.date] = {
          date: record.date,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          students: [],
        };
      }

      const day = byDate[record.date];
      if (record.status in day) {
        (day[record.status as keyof Pick<DailyBreakdown, 'present' | 'absent' | 'late' | 'excused'>] as number)++;
      }
      day.students.push({
        id: record.student_id,
        name: record.student_name || "Unknown",
        status: record.status,
      });
    });

    return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthlyData]);

  // Compute concerns data (top absent/late students)
  const computedConcerns = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (concernsTimeRange === "week") {
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (concernsTimeRange === "month") {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    } else {
      startDate = concernsCustomStartDate;
      endDate = concernsCustomEndDate;
    }

    // Count unique dates in the data
    const uniqueDates = new Set(concernsData.map(r => r.date));
    const totalDays = uniqueDates.size;

    // Aggregate by student
    const studentStats: Record<string, { name: string; absent: number; late: number; records: number }> = {};

    concernsData.forEach(record => {
      if (!studentStats[record.student_id]) {
        studentStats[record.student_id] = {
          name: record.student_name || "Unknown",
          absent: 0,
          late: 0,
          records: 0,
        };
      }
      studentStats[record.student_id].records++;
      if (record.status === "absent") studentStats[record.student_id].absent++;
      if (record.status === "late") studentStats[record.student_id].late++;
    });

    const students: StudentConcern[] = Object.entries(studentStats).map(([id, stats]) => ({
      id,
      name: stats.name,
      absent: stats.absent,
      late: stats.late,
      totalDays: stats.records,
      absentRate: stats.records > 0 ? (stats.absent / stats.records) * 100 : 0,
      lateRate: stats.records > 0 ? (stats.late / stats.records) * 100 : 0,
    }));

    return {
      startDate,
      endDate,
      totalDays,
      topAbsent: [...students].sort((a, b) => b.absent - a.absent).slice(0, 5).filter(s => s.absent > 0),
      topLate: [...students].sort((a, b) => b.late - a.late).slice(0, 5).filter(s => s.late > 0),
    };
  }, [concernsData, concernsTimeRange, concernsCustomStartDate, concernsCustomEndDate]);

  return {
    // Data
    chartData,
    monthlySummary,
    dailyBreakdown,
    concerns: computedConcerns,
    
    // Loading states
    loadingYearly,
    loadingMonthly,
    loadingConcerns,
    isLoading: loadingYearly || loadingMonthly || loadingConcerns,
    
    // Error
    error,
  };
}
