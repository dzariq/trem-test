import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

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
};

type DailyBreakdown = {
  date: string;
  status: string;
  reason: string | null;
  remarks: string | null;
};

const SEED_DATES = [
  "2026-01-08",
  "2026-01-09",
  "2026-01-10",
  "2026-01-11",
  "2026-01-12",
  "2026-01-13",
  "2026-01-14",
  "2026-01-15",
];

const STUDENT_SEED_DATA: Record<string, { statuses: AttendanceStatus[]; remarks: (string | null)[] }> = {
  // yapyapyap
  "08b6718a-e41f-4c6a-ae53-bbdf4ac346d5": {
    statuses: ["present", "present", "late", "present", "absent", "present", "excused", "present"],
    remarks: [null, null, "Traffic delay", null, "Medical leave - fever", null, "Family event", null],
  },
  // Su Jun Han
  "6a0e842a-3e25-4725-9153-0d1699db3c35": {
    statuses: ["present", "late", "present", "present", "present", "absent", "present", "excused"],
    remarks: [null, "Late arrival - car trouble", null, null, null, "Sick - MC submitted", null, "Holiday travel"],
  },
};

async function getStudentClass(studentId: string): Promise<string> {
  const { data, error } = await supabase
    .from("students")
    .select("class")
    .eq("id", studentId)
    .single();

  if (error || !data) {
    console.error("[attendance] Failed to get student class:", error);
    return "Unknown";
  }
  return data.class;
}

export async function seedParentAttendanceDemo(): Promise<{ inserted: number; skipped: number }> {
  // Only run in dev mode or when localStorage flag is set
  const shouldSeed = import.meta.env.DEV || localStorage.getItem("seed_demo") === "1";
  if (!shouldSeed) {
    return { inserted: 0, skipped: 0 };
  }

  let inserted = 0;
  let skipped = 0;

  for (const [studentId, seedData] of Object.entries(STUDENT_SEED_DATA)) {
    // Get the student's class from DB
    const studentClass = await getStudentClass(studentId);

    // Check which dates already exist
    const { data: existingRows, error: checkError } = await supabase
      .from("attendance")
      .select("date")
      .eq("student_id", studentId)
      .in("date", SEED_DATES);

    if (checkError) {
      console.error("[attendance] Error checking existing rows:", checkError);
      continue;
    }

    const existingDates = new Set((existingRows ?? []).map((r) => r.date));

    // Build insert rows for dates that don't exist
    const rowsToInsert = SEED_DATES.map((date, index) => {
      if (existingDates.has(date)) {
        return null;
      }
      return {
        student_id: studentId,
        class: studentClass,
        date,
        status: seedData.statuses[index],
        remarks: seedData.remarks[index],
      };
    }).filter((row): row is NonNullable<typeof row> => row !== null);

    skipped += SEED_DATES.length - rowsToInsert.length;

    if (rowsToInsert.length === 0) {
      continue;
    }

    const { error: insertError } = await supabase.from("attendance").insert(rowsToInsert);

    if (insertError) {
      console.error("[attendance] Error inserting seed data:", insertError);
    } else {
      inserted += rowsToInsert.length;
    }
  }

  console.log(`[attendance] Seed complete: inserted=${inserted}, skipped=${skipped}`);
  return { inserted, skipped };
}

export function useParentAttendance(studentId: string | null, selectedYear: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setRecords([]);
      return;
    }

    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);

      try {
        const yearStart = `${selectedYear}-01-01`;
        const yearEnd = `${selectedYear}-12-31`;

        const { data, error: fetchError } = await supabase
          .from("attendance")
          .select("id, student_id, student_name, class, date, status, remarks")
          .eq("student_id", studentId)
          .gte("date", yearStart)
          .lte("date", yearEnd)
          .order("date", { ascending: false });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        setRecords(data ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load attendance";
        setError(message);
        console.error("[attendance] Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [studentId, selectedYear]);

  // Calculate monthly chart data
  const chartData = useMemo<MonthlyChartData[]>(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthCounts: Record<string, { present: number; absent: number; late: number; excused: number }> = {};

    // Initialize all months
    monthNames.forEach((month) => {
      monthCounts[month] = { present: 0, absent: 0, late: 0, excused: 0 };
    });

    // Count records by month
    records.forEach((record) => {
      const date = new Date(record.date);
      const monthName = monthNames[date.getMonth()];
      const status = record.status as AttendanceStatus;

      if (monthCounts[monthName] && ["present", "absent", "late", "excused"].includes(status)) {
        monthCounts[monthName][status]++;
      }
    });

    return monthNames.map((month) => ({
      month,
      ...monthCounts[month],
    }));
  }, [records]);

  // Calculate monthly summary for selected month
  const getMonthlySummary = (monthIndex: number) => {
    const monthRecords = records.filter((r) => {
      const date = new Date(r.date);
      return date.getMonth() === monthIndex;
    });

    return {
      present: monthRecords.filter((r) => r.status === "present").length,
      absent: monthRecords.filter((r) => r.status === "absent").length,
      late: monthRecords.filter((r) => r.status === "late").length,
      excused: monthRecords.filter((r) => r.status === "excused").length,
    };
  };

  // Get daily breakdown for selected month
  const getDailyBreakdown = (monthIndex: number): DailyBreakdown[] => {
    return records
      .filter((r) => {
        const date = new Date(r.date);
        return date.getMonth() === monthIndex;
      })
      .map((r) => ({
        date: r.date,
        status: r.status,
        reason: r.status !== "present" && r.remarks ? r.remarks.split(" - ")[0] : null,
        remarks: r.remarks,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return {
    records,
    loading,
    error,
    chartData,
    getMonthlySummary,
    getDailyBreakdown,
  };
}
