import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useCampus } from "@/contexts/CampusContext";
import { useResumeTick } from "@/hooks/useRefreshOnAppResume";

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
  /** Single class filter (legacy). Ignored when selectedClasses is provided. */
  selectedClass?: string;
  /** Multi-class filter. When provided and non-empty, takes priority over selectedClass. */
  selectedClasses?: string[];
  selectedYear: number;
  selectedMonth: number;
  concernsTimeRange: "week" | "month" | "custom";
  concernsCustomStartDate: Date;
  concernsCustomEndDate: Date;
}

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

export function useAttendanceStatistics({
  selectedClass,
  selectedClasses,
  selectedYear,
  selectedMonth,
  concernsTimeRange,
  concernsCustomStartDate,
  concernsCustomEndDate,
}: UseAttendanceStatisticsProps) {
  const { activeCampus } = useCampus();
  const resumeTick = useResumeTick();
  // Resolve the class filter: prefer selectedClasses, fallback to selectedClass
  const effectiveClasses = useMemo(() => {
    if (selectedClasses && selectedClasses.length > 0) return selectedClasses;
    if (selectedClass) return [selectedClass];
    return [];
  }, [selectedClass, selectedClasses]);
  const [yearlyData, setYearlyData] = useState<AttendanceRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<AttendanceRecord[]>([]);
  const [concernsData, setConcernsData] = useState<AttendanceRecord[]>([]);
  const [concernsStudentNames, setConcernsStudentNames] = useState<Record<string, string>>({});
  const [loadingYearly, setLoadingYearly] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingConcerns, setLoadingConcerns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch yearly data for chart
  useEffect(() => {
    if (effectiveClasses.length === 0) {
      setYearlyData([]);
      return;
    }

    const fetchYearlyData = async () => {
      setLoadingYearly(true);
      setError(null);

      try {
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;

        let yearlyQuery = supabase
          .from("attendance")
          .select("*")
          .in("class", effectiveClasses)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true });
        if (activeCampus) yearlyQuery = yearlyQuery.eq("campus_code", activeCampus);
        const { data, error: queryError } = await yearlyQuery;

        if (queryError) {
          logSupabaseError("useAttendanceStatistics/yearly", queryError);
          setError(queryError.message);
          toast({
            title: "Attendance data unavailable",
            description: "Unable to load yearly attendance data.",
            variant: "destructive",
          });
          return;
        }

        setYearlyData((data ?? []).map(row => ({
          id: row.id,
          student_id: row.student_id,
          class: row.class,
          date: row.date,
          status: (row.status?.toLowerCase() ?? row.status) as AttendanceStatus,
          remarks: row.remarks,
          student_name: row.student_name,
        })));
      } catch (err) {
        console.error("[useAttendanceStatistics/yearly]", err);
        setError("Failed to fetch yearly data");
        toast({
          title: "Attendance data unavailable",
          description: "Unable to load yearly attendance data.",
          variant: "destructive",
        });
      } finally {
        setLoadingYearly(false);
      }
    };

    fetchYearlyData();
  }, [effectiveClasses, selectedYear, activeCampus, resumeTick]);

  // Fetch monthly data for daily breakdown
  useEffect(() => {
    if (effectiveClasses.length === 0) {
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

        let monthlyQuery = supabase
          .from("attendance")
          .select("*")
          .in("class", effectiveClasses)
          .gte("date", startDateStr)
          .lte("date", endDateStr)
          .order("date", { ascending: false });
        if (activeCampus) monthlyQuery = monthlyQuery.eq("campus_code", activeCampus);
        const { data, error: queryError } = await monthlyQuery;

        if (queryError) {
          logSupabaseError("useAttendanceStatistics/monthly", queryError);
          setError(queryError.message);
          toast({
            title: "Attendance data unavailable",
            description: "Unable to load monthly attendance data.",
            variant: "destructive",
          });
          return;
        }

        const rows = (data ?? []).map(row => ({
          id: row.id,
          student_id: row.student_id,
          class: row.class,
          date: row.date,
          status: (row.status?.toLowerCase() ?? row.status) as AttendanceStatus,
          remarks: row.remarks,
          student_name: row.student_name,
        }));

        const studentIds = Array.from(
          new Set(rows.map((row) => row.student_id).filter(Boolean))
        );

        let nameMap: Record<string, string> = {};
        if (studentIds.length > 0) {
          const { data: students, error: studentError } = await supabase
            .from("students")
            .select("id, name")
            .in("id", studentIds);

          if (studentError) {
            logSupabaseError("useAttendanceStatistics/monthly-students", studentError);
          } else {
            nameMap = (students ?? []).reduce<Record<string, string>>((acc, student) => {
              if (student?.id && student?.name) {
                acc[student.id] = student.name;
              }
              return acc;
            }, {});
          }
        }

        const hydrated = rows.map((row) => ({
          ...row,
          student_name: nameMap[row.student_id] || row.student_name || null,
        }));

        setMonthlyData(hydrated);
      } catch (err) {
        console.error("[useAttendanceStatistics/monthly]", err);
        toast({
          title: "Attendance data unavailable",
          description: "Unable to load monthly attendance data.",
          variant: "destructive",
        });
      } finally {
        setLoadingMonthly(false);
      }
    };

    fetchMonthlyData();
  }, [effectiveClasses, selectedYear, selectedMonth, activeCampus, resumeTick]);

  // Fetch concerns data based on time range
  useEffect(() => {
    if (effectiveClasses.length === 0) {
      setConcernsData([]);
      setConcernsStudentNames({});
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

        let concernsQuery = supabase
          .from("attendance")
          .select("*")
          .in("class", effectiveClasses)
          .gte("date", startDateStr)
          .lte("date", endDateStr);
        if (activeCampus) concernsQuery = concernsQuery.eq("campus_code", activeCampus);
        const { data, error: queryError } = await concernsQuery;

        if (queryError) {
          logSupabaseError("useAttendanceStatistics/concerns", queryError);
          toast({
            title: "Attendance data unavailable",
            description: "Unable to load attendance concerns.",
            variant: "destructive",
          });
          return;
        }

        const rows = (data ?? []).map(row => ({
          id: row.id,
          student_id: row.student_id,
          class: row.class,
          date: row.date,
          status: (row.status?.toLowerCase() ?? row.status) as AttendanceStatus,
          remarks: row.remarks,
          student_name: row.student_name,
        }));

        const studentIds = Array.from(
          new Set(rows.map((row) => row.student_id).filter(Boolean))
        );

        let nameMap: Record<string, string> = {};
        if (studentIds.length > 0) {
          const { data: students, error: studentError } = await supabase
            .from("students")
            .select("id, name")
            .in("id", studentIds);

          if (studentError) {
            logSupabaseError("useAttendanceStatistics/concerns-students", studentError);
          } else {
            nameMap = (students ?? []).reduce<Record<string, string>>((acc, student) => {
              if (student?.id && student?.name) {
                acc[student.id] = student.name;
              }
              return acc;
            }, {});
          }
        }

        setConcernsData(rows);
        setConcernsStudentNames(nameMap);
      } catch (err) {
        console.error("[useAttendanceStatistics/concerns]", err);
        setConcernsStudentNames({});
        toast({
          title: "Attendance data unavailable",
          description: "Unable to load attendance concerns.",
          variant: "destructive",
        });
      } finally {
        setLoadingConcerns(false);
      }
    };

    fetchConcernsData();
  }, [effectiveClasses, concernsTimeRange, concernsCustomStartDate, concernsCustomEndDate, activeCampus, resumeTick]);

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
        name: record.student_name || "Student",
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
      const resolvedName =
        concernsStudentNames[record.student_id] ||
        record.student_name ||
        "Student";
      if (!studentStats[record.student_id]) {
        studentStats[record.student_id] = {
          name: resolvedName,
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
  }, [
    concernsData,
    concernsStudentNames,
    concernsTimeRange,
    concernsCustomStartDate,
    concernsCustomEndDate,
  ]);

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
