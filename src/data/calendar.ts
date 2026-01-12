import { supabase } from "@/lib/supabase";
import type { CalendarTag } from "@/types/calendarTags";
import { getMyProfile } from "@/data/profile";
import { listMyLinkedStudents } from "@/data/students";

export type UpcomingEvent = {
  id: string | number;
  title: string;
  description?: string;
  start: Date | null;
  end: Date | null;
  startDay: string;
  endDay: string;
  allDay: boolean;
  tags: CalendarTag[];
  category: string;
  location: string;
  date: string;
  time: string;
};

export type ListUpcomingEventsParams = {
  role?: string;
  limit?: number;
};

export type ListCalendarEventsParams = {
  role?: string;
};

const DEFAULT_LIMIT = 10;

const logSupabaseError = (label: string, error: any) => {
  console.error(`[calendar] ${label} error:`, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  });
};

const isMissingColumn = (error: { message?: string; code?: string } | null, column: string) => {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  return message.includes("does not exist") && message.includes(column.toLowerCase());
};

const formatTimeLabel = (startDateTime?: string | null, endDateTime?: string | null) => {
  if (!startDateTime) return "";
  const start = new Date(startDateTime);
  const end = endDateTime ? new Date(endDateTime) : null;
  const format = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (end) return `${format(start)} - ${format(end)}`;
  return format(start);
};

const isMidnightUtc = (value?: string | null) =>
  Boolean(value && String(value).includes("T00:00:00"));

const mapCalendarRow = (row: any): UpcomingEvent => {
  const categorySource =
    row.event_category ??
    row.event_type ??
    "general";
  const category =
    typeof categorySource === "string" ? categorySource.toLowerCase() : "general";

  const startDateTime = row.start_date ?? null;
  const endDateTime = row.end_date ?? null;
  const startDay = startDateTime ? String(startDateTime).slice(0, 10) : "";
  const endDay = endDateTime ? String(endDateTime).slice(0, 10) : startDay;
  const allDay =
    row.is_all_day ??
    (isMidnightUtc(startDateTime) && (!endDateTime || isMidnightUtc(endDateTime)));
  const timeLabel = allDay ? "All Day" : formatTimeLabel(startDateTime, endDateTime);

  return {
    id: row.id,
    // Prefer title/name fields if available.
    title: row.title ?? "Event",
    description: row.description ?? "",
    start: startDateTime ? new Date(startDateTime) : null,
    end: endDateTime ? new Date(endDateTime) : null,
    startDay,
    endDay,
    allDay: Boolean(allDay),
    tags: (Array.isArray(row.event_tags) ? row.event_tags : []) as CalendarTag[],
    category,
    location: row.location ?? "School",
    date: startDay,
    time: timeLabel,
  };
};

const normalizeTargetRoles = (targetRoles: any): string[] => {
  if (!targetRoles) return [];
  if (Array.isArray(targetRoles)) {
    return targetRoles.map((role) => String(role).toLowerCase());
  }
  if (typeof targetRoles === "string") {
    return targetRoles
      .split(",")
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

const matchesTargetRole = (targetRoles: any, role?: string | null) => {
  if (!role) return true;
  const normalizedRole = role.toLowerCase();
  const roles = normalizeTargetRoles(targetRoles);
  if (roles.length === 0) return true;
  return roles.includes(normalizedRole) || roles.includes("all");
};

// Apply role targeting client-side to avoid query operator mismatches.
const filterByTargetRole = (rows: any[], role?: string | null) =>
  rows.filter((row) => matchesTargetRole(row.target_roles, role));

const dedupeRows = (rows: any[]) => {
  const map = new Map<string | number, any>();
  rows.forEach((row) => {
    if (!map.has(row.id)) {
      map.set(row.id, row);
    }
  });
  return Array.from(map.values());
};

const sortByStartDate = (rows: any[]) =>
  rows.sort((a, b) => String(a.start_date ?? "").localeCompare(String(b.start_date ?? "")));

const resolveCalendarScope = async (roleOverride?: string) => {
  const profile = await getMyProfile();
  const role = roleOverride ?? profile.role ?? null;
  const campusId = profile.assigned_campus_id ?? profile.campus_id ?? null;
  const linkedStudents = await listMyLinkedStudents();
  const studentIds = linkedStudents.map((student) => student.id).filter(Boolean);

  return { role, campusId, studentIds };
};

const buildCampusFilter = (campusId: string | null) => {
  if (!campusId) return null;
  return `campus_id.eq.${campusId},campus_id.is.null`;
};

const buildVisibilityStudentFilter = (options: { includeStudent: boolean }, studentIds: string[]) => {
  if (options.includeStudent && studentIds.length > 0) {
    return `visibility.eq.public,student_id.in.(${studentIds.join(",")})`;
  }
  return "visibility.eq.public";
};

const fetchScopedRows = async (
  baseQuery: () => any,
  campusId: string | null,
  studentIds: string[],
  label: string,
  role?: string | null
) => {
  const buildQuery = (options: { includeCampus: boolean; includeStudent: boolean }) => {
    let query = baseQuery();
    const visibilityStudentFilter = buildVisibilityStudentFilter(options, studentIds);
    query = query.or(visibilityStudentFilter);
    if (options.includeCampus) {
      const campusFilter = buildCampusFilter(campusId);
      if (campusFilter) {
        // Apply campus scope as a separate OR filter so null campuses remain visible.
        query = query.or(campusFilter);
      }
    }
    return query;
  };

  let options = {
    includeCampus: Boolean(campusId),
    includeStudent: studentIds.length > 0,
  };

  let { data, error } = await buildQuery(options);
  if (error) {
    logSupabaseError(`${label} role=${role ?? "unknown"} campus=${campusId ?? "none"} students=${studentIds.length}`, error);
  }

  if (error) {
    const missingCampus = options.includeCampus && isMissingColumn(error, "campus_id");
    const missingStudent = options.includeStudent && isMissingColumn(error, "student_id");
    if (missingCampus || missingStudent) {
      options = {
        includeCampus: missingCampus ? false : options.includeCampus,
        includeStudent: missingStudent ? false : options.includeStudent,
      };
      ({ data, error } = await buildQuery(options));
      if (error) {
        logSupabaseError(`${label} fallback role=${role ?? "unknown"} campus=${campusId ?? "none"} students=${studentIds.length}`, error);
      }
    }
  }

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export async function listCalendarEvents(
  year: number,
  month: number,
  params: ListCalendarEventsParams = {}
): Promise<UpcomingEvent[]> {
  const { role, campusId, studentIds } = await resolveCalendarScope(params.role);
  const monthStr = String(month).padStart(2, "0");
  const monthStart = `${year}-${monthStr}-01T00:00:00Z`;
  const nextMonthDate = new Date(Date.UTC(year, month - 1, 1));
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
  const nextMonthStart = nextMonthDate.toISOString().slice(0, 19) + "Z";

  const baseQuery = () =>
    supabase
      .from("calendar_events")
      .select("*")
      .lt("start_date", nextMonthStart)
      .gte("end_date", monthStart)
      .order("start_date", { ascending: true });

  const rows = await fetchScopedRows(baseQuery, campusId, studentIds, "listCalendarEvents", role);
  console.log("[calendar] fetched rows", {
    count: rows.length,
    sample: rows[0],
    role,
    campusId,
    studentIdsCount: studentIds.length,
    rangeStart: monthStart,
    rangeEnd: nextMonthStart,
  });
  const targetRoleStats = rows.reduce(
    (acc, row) => {
      const roles = normalizeTargetRoles(row.target_roles);
      if (roles.length === 0) {
        acc.missingTargetRoles += 1;
        return acc;
      }
      if (roles.includes("all")) {
        acc.matchedAll += 1;
      }
      if (role && roles.includes(role.toLowerCase())) {
        acc.matchedRole += 1;
      }
      return acc;
    },
    { missingTargetRoles: 0, matchedAll: 0, matchedRole: 0 }
  );
  const filteredRows = filterByTargetRole(rows, role);
  console.log("[calendar] after client filter", {
    count: filteredRows.length,
    filteredOut: rows.length - filteredRows.length,
    reasons: targetRoleStats,
  });
  return sortByStartDate(dedupeRows(filteredRows)).map(mapCalendarRow);
}

export async function listUpcomingEvents(
  params: ListUpcomingEventsParams = {}
): Promise<UpcomingEvent[]> {
  const limit = params.limit ?? DEFAULT_LIMIT;
  const now = new Date().toISOString();
  const { role, campusId, studentIds } = await resolveCalendarScope(params.role);

  const baseQuery = () =>
    supabase
      .from("calendar_events")
      .select("*")
      .gte("start_date", now)
      .order("start_date", { ascending: true });

  const rows = await fetchScopedRows(baseQuery, campusId, studentIds, "listUpcomingEvents", role);
  const filteredRows = filterByTargetRole(rows, role);

  return sortByStartDate(dedupeRows(filteredRows))
    .slice(0, limit)
    .map(mapCalendarRow);
}
