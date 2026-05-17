import type { UpcomingEvent } from "@/data/calendar";
import type { TagCategory } from "@/types/calendarTags";
import { TAG_CATEGORIES } from "@/types/calendarTags";

// Simplified event type categories for the mobile filter UI.
// Maps each filter label to the underlying TagCategory values it covers.
export type EventTypeFilter = "academic" | "exam" | "holiday" | "event" | "cca";

export const EVENT_TYPE_FILTERS: EventTypeFilter[] = [
  "academic",
  "exam",
  "holiday",
  "event",
  "cca",
];

export const EVENT_TYPE_LABELS: Record<EventTypeFilter, string> = {
  academic: "Academic",
   exam: "Exam",
   holiday: "Holiday",
   event: "Events",
   cca: "CCA",
};

export const EVENT_TYPE_COLORS: Record<EventTypeFilter, string> = {
  academic: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  exam: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  holiday: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  event: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  cca: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
};

// Which TagCategory values each filter covers
const FILTER_TO_CATEGORIES: Record<EventTypeFilter, TagCategory[]> = {
  academic: ["school-level", "students", "parents"],
  exam: ["exams"],
  holiday: ["holidays"],
  event: ["events", "staff-admin", "due-dates"],
  cca: [], // CCA events come from a separate data source, not calendar_events tags
};

// Role-based defaults: which filters are ON by default
export const PARENT_DEFAULT_FILTERS: EventTypeFilter[] = ["academic", "exam", "holiday"];
export const TEACHER_DEFAULT_FILTERS: EventTypeFilter[] = ["academic", "exam", "cca"];

export function getDefaultFilters(role: "parent" | "teacher" | "student"): EventTypeFilter[] {
  return role === "teacher" ? [...TEACHER_DEFAULT_FILTERS] : [...PARENT_DEFAULT_FILTERS];
}

// Filter events by the selected event type filters (UI-only, no DB writes)
export function filterEventsByTypes(
  events: UpcomingEvent[],
  selectedTypes: EventTypeFilter[]
): UpcomingEvent[] {
  if (selectedTypes.length === 0) return [];

  const allowedCategories = new Set<TagCategory>();
  selectedTypes.forEach((type) => {
    FILTER_TO_CATEGORIES[type].forEach((cat) => allowedCategories.add(cat));
  });

  return events.filter((event) => {
    // First check if any tags match the allowed categories
    if (event.tags.some((tag) => allowedCategories.has(TAG_CATEGORIES[tag]))) {
      return true;
    }

    // Also check the event category field (from event_type/event_category in DB)
    // This ensures we match events that use the web admin's classification system
    const category = (event.category || "").toLowerCase();

    // Map category strings to our filter types
    if (selectedTypes.includes("exam") && (category.includes("exam") || category.includes("test") || category.includes("assessment") || category.includes("checkpoint") || category.includes("igcse") || category.includes("mye"))) {
      return true;
    }
    if (selectedTypes.includes("holiday") && (category.includes("holiday") || category.includes("term break"))) {
      return true;
    }
    if (selectedTypes.includes("academic") && (category.includes("academic") || category.includes("school") || category.includes("class") || category.includes("extra class") || category.includes("enrichment") || category.includes("due date"))) {
      return true;
    }
    if (selectedTypes.includes("event") && (category.includes("event") || category.includes("activity") || category.includes("meeting") || category.includes("field trip") || category.includes("open day") || category.includes("workshop") || category.includes("conference") || category.includes("ptc") || category.includes("family") || category.includes("team building") || category.includes("back to school") || category.includes("celebration"))) {
      return true;
    }

    return false;
  });
}

// --- Upcoming events tab filtering ---

export type UpcomingTab = "events" | "exams" | "holidays" | "cca";

 export const UPCOMING_TABS: { value: UpcomingTab; label: string }[] = [
   { value: "events", label: "Events" },
   { value: "cca", label: "CCA" },
   { value: "exams", label: "Exams" },
   { value: "holidays", label: "Holidays" },
 ];

// Tab colors matching the category filter button colors
export const UPCOMING_TAB_COLORS: Record<UpcomingTab, string> = {
  events: "bg-purple-500 text-white data-[state=active]:bg-purple-500 data-[state=active]:text-white",
  exams: "bg-red-500 text-white data-[state=active]:bg-red-500 data-[state=active]:text-white",
  holidays: "bg-green-500 text-white data-[state=active]:bg-green-500 data-[state=active]:text-white",
  cca: "bg-primary text-primary-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
};

const toYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get future events (event ends on or after today)
export function getFutureEvents(events: UpcomingEvent[]): UpcomingEvent[] {
  const todayYmd = toYmd(new Date());
  return events.filter((e) => e.endDay >= todayYmd);
}

// Get events within the next N days (starts on or before today+N and ends on or after today)
export function getEventsWithinDays(events: UpcomingEvent[], days: number): UpcomingEvent[] {
  const today = new Date();
  const todayYmd = toYmd(today);
  const end = new Date(today);
  end.setDate(end.getDate() + days);
  const endYmd = toYmd(end);
  return events
    .filter((e) => e.endDay >= todayYmd && e.startDay <= endYmd)
    .sort((a, b) => a.startDay.localeCompare(b.startDay));
}

/**
 * Check if event is an exam based on tags, category, or event type.
 * This matches the web admin portal logic which checks event_type.
 */
const isExamEvent = (event: UpcomingEvent): boolean => {
  // Check tags first (mobile tag system)
  if (event.tags.some((tag) => TAG_CATEGORIES[tag] === "exams")) {
    return true;
  }
  // Check category (matches web admin's event_category field)
  const category = (event.category || "").toLowerCase();
  if (category.includes("exam") || category.includes("test") || category.includes("assessment") || category.includes("checkpoint") || category.includes("igcse") || category.includes("mye")) {
    return true;
  }
  return false;
};

/**
 * Check if event is a holiday based on tags, category, or event type.
 * This matches the web admin portal logic which checks event_type.
 */
const isHolidayEvent = (event: UpcomingEvent): boolean => {
  // Check tags first (mobile tag system)
  if (event.tags.some((tag) => TAG_CATEGORIES[tag] === "holidays")) {
    return true;
  }
  // Check category (matches web admin's event_category or event_type field)
  const category = (event.category || "").toLowerCase();
  if (category.includes("holiday") || category.includes("term break")) {
    return true;
  }
  return false;
};

/**
 * Check if event belongs to Events, Students, or Parents categories.
 * This filters for special events, field trips, student activities, PTC, family events, etc.
 */
const isEventsEvent = (event: UpcomingEvent): boolean => {
  // Check tags for events, students, parents categories
  if (event.tags.some((tag) => {
    const cat = TAG_CATEGORIES[tag];
    return cat === "events" || cat === "students" || cat === "parents";
  })) {
    return true;
  }
  // Also check category string field
  const category = (event.category || "").toLowerCase();
  return category.includes("event") ||
         category.includes("student") ||
         category.includes("parent") ||
         category.includes("family") ||
         category.includes("conference") ||
         category.includes("field trip") ||
         category.includes("open day") ||
         category.includes("workshop") ||
         category.includes("ptc") ||
         category.includes("team building") ||
         category.includes("back to school") ||
         category.includes("celebration");
};

// Filter for a specific tab
export function filterByUpcomingTab(
  events: UpcomingEvent[],
  tab: UpcomingTab,
  limit?: number
): UpcomingEvent[] {
  const within30 = getEventsWithinDays(events, 30);
  const allFuture = getFutureEvents(events).sort((a, b) => a.startDay.localeCompare(b.startDay));
  const cap = (arr: UpcomingEvent[]) => (typeof limit === "number" ? arr.slice(0, limit) : arr);
  // Fallback: if no items in 30 days, show all upcoming for that category
  const withFallback = (filtered: UpcomingEvent[], allFiltered: UpcomingEvent[]) =>
    filtered.length > 0 ? filtered : allFiltered;

  switch (tab) {
    case "events":
      return cap(withFallback(within30.filter(isEventsEvent), allFuture.filter(isEventsEvent)));

    case "exams":
      return cap(withFallback(within30.filter(isExamEvent), allFuture.filter(isExamEvent)));

    case "holidays":
      return cap(withFallback(within30.filter(isHolidayEvent), allFuture.filter(isHolidayEvent)));

    default:
      return cap(within30.length > 0 ? within30 : allFuture);
  }
}

// Format a date range for multi-day events (e.g. "Feb 7–10")
export function formatDateRange(startDay: string, endDay: string): string {
  const [sYear, sMonth, sDay] = startDay.split("-").map(Number);
  const [eYear, eMonth, eDay] = endDay.split("-").map(Number);
  const startDate = new Date(sYear, sMonth - 1, sDay);
  const endDate = new Date(eYear, eMonth - 1, eDay);

  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });

  if (startDay === endDay) {
    return `${startMonth} ${sDay}`;
  }

  if (startMonth === endMonth && sYear === eYear) {
    return `${startMonth} ${sDay}–${eDay}`;
  }

  return `${startMonth} ${sDay} – ${endMonth} ${eDay}`;
}

// Calculate duration in days between two YYYY-MM-DD strings
export function getDaysDuration(startDay: string, endDay: string): number {
  const [sY, sM, sD] = startDay.split("-").map(Number);
  const [eY, eM, eD] = endDay.split("-").map(Number);
  const start = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// Get the primary event type color for a card indicator
export function getEventTypeColor(event: UpcomingEvent): string {
  for (const tag of event.tags) {
    const cat = TAG_CATEGORIES[tag];
    if (cat === "exams") return "bg-red-500";
    if (cat === "holidays") return "bg-green-500";
    if (cat === "events") return "bg-purple-500";
    if (cat === "school-level") return "bg-blue-500";
    if (cat === "staff-admin") return "bg-slate-500";
    if (cat === "due-dates") return "bg-amber-500";
    if (cat === "students") return "bg-teal-500";
    if (cat === "parents") return "bg-pink-500";
  }
  return "bg-muted";
}
