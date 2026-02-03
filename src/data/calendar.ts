import { supabase } from "@/lib/supabase";
import type { CalendarTag } from "@/types/calendarTags";
import { getMyProfile, type UserProfile } from "@/data/profile";
import { listMyLinkedStudents, type LinkedStudent } from "@/data/students";

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
  visibility?: string;
  visibleDepartments?: string[];
  visibleUserIds?: string[];
  studentId?: string | null;
  campusId?: string | null;
  schoolLevel?: string | null;
};

export type ListUpcomingEventsParams = {
  role?: string;
  limit?: number;
};

export type GetUpcomingEventsParams = {
  events: UpcomingEvent[];
  fromDate?: Date;
  limit?: number;
  role?: string;
  selectedStudentId?: string | null;
  teacherUserId?: string | null;
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
    // Additional fields for visibility filtering
    visibility: row.visibility ?? "public",
    visibleDepartments: row.visible_departments ?? [],
    visibleUserIds: row.visible_user_ids ?? [],
    studentId: row.student_id ?? null,
    campusId: row.campus_id ?? null,
    schoolLevel: row.school_level ?? null,
  };
};

/**
 * Client-side visibility filter that matches web admin portal logic.
 *
 * Visibility rules:
 * - 'public' or 'staff': visible to all authenticated users (teachers, parents, students)
 * - 'departments': only visible to users in the specified departments
 * - 'users': only visible to specified user IDs
 *
 * For parents: also show events tied to their linked students
 * For teachers: also show events tied to their assigned campus
 */
const isEventVisibleToUser = (
  event: UpcomingEvent,
  profile: UserProfile,
  linkedStudentIds: string[]
): boolean => {
  const visibility = event.visibility || "public";
  const role = profile.role?.toLowerCase() ?? "";

  // Public and staff events are visible to all authenticated users
  if (visibility === "public" || visibility === "staff") {
    return true;
  }

  // Department-based visibility (primarily for teachers)
  if (visibility === "departments") {
    // For now, show department events to teachers (web admin shows these to staff)
    if (role === "teacher" || role === "admin") {
      return true;
    }
    return false;
  }

  // User-specific visibility
  if (visibility === "users") {
    const visibleUserIds = event.visibleUserIds || [];
    if (visibleUserIds.includes(profile.user_id)) {
      return true;
    }
    return false;
  }

  // For parents: check if event is tied to their linked students
  if (role === "parent" && event.studentId) {
    return linkedStudentIds.includes(event.studentId);
  }

  // For teachers: check campus matching
  if (role === "teacher" && event.campusId && profile.assigned_campus_id) {
    return event.campusId === profile.assigned_campus_id || event.campusId === null;
  }

  // Default: show the event (be permissive rather than hiding events)
  return true;
};

/**
 * Filter events by visibility rules based on user role and profile
 */
const filterEventsByVisibility = (
  events: UpcomingEvent[],
  profile: UserProfile,
  linkedStudentIds: string[]
): UpcomingEvent[] => {
  const role = profile.role?.toLowerCase() ?? "";

  // Admin sees everything
  if (role === "admin") {
    return events;
  }

  return events.filter((event) => isEventVisibleToUser(event, profile, linkedStudentIds));
};

const dedupeRows = (events: UpcomingEvent[]): UpcomingEvent[] => {
  const map = new Map<string | number, UpcomingEvent>();
  events.forEach((event) => {
    if (!map.has(event.id)) {
      map.set(event.id, event);
    }
  });
  return Array.from(map.values());
};

const sortByStartDate = (events: UpcomingEvent[]): UpcomingEvent[] =>
  events.sort((a, b) => (a.startDay ?? "").localeCompare(b.startDay ?? ""));

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const toYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getEventSortKey = (event: UpcomingEvent) => {
  if (event.start instanceof Date && Number.isFinite(event.start.getTime())) {
    return event.start.getTime();
  }
  if (event.startDay) {
    const parsed = Date.parse(`${event.startDay}T00:00:00`);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return Number.POSITIVE_INFINITY;
};

const getEventDedupeKey = (event: UpcomingEvent) => {
  const title = (event.title ?? "").trim().toLowerCase();
  const startDay = event.startDay ?? "";
  const category = (event.category ?? "").trim().toLowerCase();
  return `${title}__${startDay}__${category}`;
};

export function getUpcomingEvents(
  params: GetUpcomingEventsParams
): UpcomingEvent[] {
  const { events, fromDate = new Date(), limit = 5 } = params;
  const fromDay = toYmd(startOfDay(fromDate));

  const upcoming = events
    .filter((event) => Boolean(event.startDay) && event.startDay >= fromDay)
    .sort((a, b) => getEventSortKey(a) - getEventSortKey(b));

  const deduped: UpcomingEvent[] = [];
  const seenKeys = new Set<string>();
  upcoming.forEach((event) => {
    const key = getEventDedupeKey(event);
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    deduped.push(event);
  });

  return deduped.slice(0, limit);
}

/**
 * Resolve calendar scope: get user profile and linked students for visibility filtering.
 */
const resolveCalendarScope = async (roleOverride?: string) => {
  const profile = await getMyProfile();
  const role = roleOverride ?? profile.role ?? null;
  const linkedStudents = await listMyLinkedStudents();
  const studentIds = linkedStudents.map((student) => student.id).filter(Boolean);

  return { profile, role, studentIds, linkedStudents };
};

export async function listCalendarEvents(
  year: number,
  month: number,
  params: ListCalendarEventsParams = {}
): Promise<UpcomingEvent[]> {
  const { profile, role, studentIds } = await resolveCalendarScope(params.role);
  const monthStr = String(month).padStart(2, "0");
  const monthStart = `${year}-${monthStr}-01T00:00:00Z`;
  const nextMonthDate = new Date(Date.UTC(year, month - 1, 1));
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
  const nextMonthStart = nextMonthDate.toISOString().slice(0, 19) + "Z";

  // Fetch all events for the month range (same approach as web admin portal)
  const { data: rows, error } = await supabase
    .from("calendar_events")
    .select("*")
    .lt("start_date", nextMonthStart)
    .gte("end_date", monthStart)
    .order("start_date", { ascending: true });

  if (error) {
    logSupabaseError(`listCalendarEvents role=${role ?? "unknown"}`, error);
    throw new Error(error.message);
  }

  const allEvents = (rows ?? []).map(mapCalendarRow);

  console.log("[calendar] fetched rows", {
    count: allEvents.length,
    sample: allEvents[0],
    role,
    studentIdsCount: studentIds.length,
    rangeStart: monthStart,
    rangeEnd: nextMonthStart,
  });

  // Apply client-side visibility filtering based on user role and profile
  const filteredEvents = filterEventsByVisibility(allEvents, profile, studentIds);

  console.log("[calendar] after visibility filter", {
    total: allEvents.length,
    visible: filteredEvents.length,
    filteredOut: allEvents.length - filteredEvents.length,
    role,
  });

  return sortByStartDate(dedupeRows(filteredEvents));
}

export async function listUpcomingEvents(
  params: ListUpcomingEventsParams = {}
): Promise<UpcomingEvent[]> {
  const limit = params.limit ?? DEFAULT_LIMIT;
  const fromDate = startOfDay(new Date());
  const fromIso = fromDate.toISOString();
  const { profile, role, studentIds } = await resolveCalendarScope(params.role);

  // Fetch all upcoming events (same approach as web admin portal)
  const { data: rows, error } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("start_date", fromIso)
    .order("start_date", { ascending: true });

  if (error) {
    logSupabaseError(`listUpcomingEvents role=${role ?? "unknown"}`, error);
    throw new Error(error.message);
  }

  const allEvents = (rows ?? []).map(mapCalendarRow);

  // Apply client-side visibility filtering
  const filteredEvents = filterEventsByVisibility(allEvents, profile, studentIds);
  const mapped = sortByStartDate(dedupeRows(filteredEvents));

  return getUpcomingEvents({ events: mapped, fromDate, limit, role });
}
