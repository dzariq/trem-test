import { eachDayOfInterval, format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";

export const HOLIDAY_CATEGORY_NAMES = [
  "Public Holiday",
  "Replacement Public Holiday",
  "School Holiday (Term Break)",
] as const;

const HOLIDAY_NAME_SET = new Set<string>(
  HOLIDAY_CATEGORY_NAMES.map((n) => n.toLowerCase()),
);

export type HolidayEventLike = {
  start_date: string | Date | null;
  end_date: string | Date | null;
  // Either a joined category object or a category name string
  event_categories?: { name?: string | null } | null;
  category?: string | null;
  event_tags?: string[] | null;
  tags?: string[] | null;
};

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  // Treat YYYY-MM-DD as local date to avoid timezone drift
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  try {
    return parseISO(value);
  } catch {
    return null;
  }
}

function eventIsHoliday(event: HolidayEventLike): boolean {
  const catName = (event.event_categories?.name ?? event.category ?? "")
    .toString()
    .toLowerCase();
  if (catName && HOLIDAY_NAME_SET.has(catName)) return true;
  const tags = event.event_tags ?? event.tags ?? [];
  for (const tag of tags) {
    if (tag && HOLIDAY_NAME_SET.has(String(tag).toLowerCase())) return true;
  }
  return false;
}

/**
 * Build a set of YYYY-MM-DD strings for every day covered by a holiday event.
 * Overlapping holidays collapse into a single entry.
 */
export function buildHolidayDateSet(
  events: HolidayEventLike[],
  rangeStart?: Date,
  rangeEnd?: Date,
): Set<string> {
  const set = new Set<string>();
  const clampStart = rangeStart ? rangeStart.getTime() : -Infinity;
  const clampEnd = rangeEnd ? rangeEnd.getTime() : Infinity;

  for (const event of events) {
    if (!eventIsHoliday(event)) continue;
    const start = toDate(event.start_date);
    const end = toDate(event.end_date) ?? start;
    if (!start || !end) continue;

    const iterStart = new Date(Math.max(start.getTime(), clampStart));
    const iterEnd = new Date(Math.min(end.getTime(), clampEnd));
    if (iterStart.getTime() > iterEnd.getTime()) continue;

    // Normalize to local-day boundaries before iterating
    iterStart.setHours(0, 0, 0, 0);
    iterEnd.setHours(0, 0, 0, 0);

    const days = eachDayOfInterval({ start: iterStart, end: iterEnd });
    for (const d of days) {
      set.add(format(d, "yyyy-MM-dd"));
    }
  }

  return set;
}

/** Returns true for Sat/Sun or any date present in the holiday set. */
export function isBlockedAttendanceDate(date: Date, holidaySet: Set<string>): boolean {
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return true;
  return holidaySet.has(format(date, "yyyy-MM-dd"));
}

/** Stable key for memoization / React Query cache invalidation. */
export function holidaySetKey(set: Set<string>): string {
  return Array.from(set).sort().join(",");
}

/**
 * Fetch raw holiday-bearing calendar events for a date range.
 * Bypasses role visibility filtering (which would hide events from
 * teachers/parents in some cases).
 */
export async function fetchHolidayEventsForRange(
  startDate: Date,
  endDate: Date,
  campusCode?: string | null,
): Promise<HolidayEventLike[]> {
  const startIso = format(startDate, "yyyy-MM-dd");
  // end exclusive boundary, push to day-after for the query
  const endIso = format(endDate, "yyyy-MM-dd") + "T23:59:59Z";

  let query = supabase
    .from("calendar_events")
    .select("start_date, end_date, event_tags, event_categories:event_category(name)")
    .lte("start_date", endIso)
    .gte("end_date", startIso + "T00:00:00Z");

  if (campusCode) {
    query = query.or(`campus_code.eq.${campusCode},campus_code.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[attendanceCalendar/fetchHolidayEventsForRange]", error);
    return [];
  }
  return (data ?? []) as unknown as HolidayEventLike[];
}

/**
 * Count school days (Mon–Fri minus holidays) in an inclusive interval.
 */
export function countSchoolDays(
  start: Date,
  end: Date,
  holidaySet: Set<string>,
): number {
  if (start.getTime() > end.getTime()) return 0;
  return eachDayOfInterval({ start, end }).filter(
    (d) => !isBlockedAttendanceDate(d, holidaySet),
  ).length;
}