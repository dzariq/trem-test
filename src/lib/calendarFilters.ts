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
  event: "Event",
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

  return events.filter((event) =>
    event.tags.some((tag) => allowedCategories.has(TAG_CATEGORIES[tag]))
  );
}

// --- Upcoming events tab filtering ---

export type UpcomingTab = "upcoming" | "exams" | "holidays";

export const UPCOMING_TABS: { value: UpcomingTab; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "exams", label: "Exams" },
  { value: "holidays", label: "Holidays" },
];

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

// Filter for a specific tab
export function filterByUpcomingTab(
  events: UpcomingEvent[],
  tab: UpcomingTab,
  limit = 5
): UpcomingEvent[] {
  const future = getFutureEvents(events);

  switch (tab) {
    case "upcoming":
      return future.slice(0, limit);

    case "exams":
      return future
        .filter((e) => e.tags.some((tag) => TAG_CATEGORIES[tag] === "exams"))
        .slice(0, limit);

    case "holidays": {
      // Only multi-day holidays (stacked)
      return future
        .filter(
          (e) =>
            e.tags.some((tag) => TAG_CATEGORIES[tag] === "holidays") &&
            e.startDay !== e.endDay
        )
        .slice(0, limit);
    }

    default:
      return future.slice(0, limit);
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
