import {
  CalendarTag,
  CalendarEvent,
  TagCategory,
  UserRole,
  TAG_CATEGORIES,
  TAG_DISPLAY_NAMES,
  CATEGORY_DISPLAY_NAMES,
  TEACHER_HIDDEN_TAGS,
  PARENT_HIDDEN_TAGS,
} from "@/types/calendarTags";
import { mapDbToCategory } from "@/lib/calendarCategorySubtypes";

// Reverse lookup: display name (e.g. "Internal Event") -> tag slug (e.g. "internal-event")
const DISPLAY_NAME_TO_TAG: Record<string, CalendarTag> = Object.entries(TAG_DISPLAY_NAMES)
  .reduce((acc, [tag, label]) => {
    acc[(label as string).toLowerCase()] = tag as CalendarTag;
    return acc;
  }, {} as Record<string, CalendarTag>);

// Get display name for a tag
export function getTagDisplayName(tag: CalendarTag): string {
  return TAG_DISPLAY_NAMES[tag] || tag;
}

// Get category for a tag
export function getTagCategory(tag: CalendarTag): TagCategory {
  return TAG_CATEGORIES[tag];
}

// Get display name for a category
export function getCategoryDisplayName(category: TagCategory): string {
  return CATEGORY_DISPLAY_NAMES[category];
}

// Get color classes for a tag based on its category
export function getTagColor(tag: CalendarTag): string {
  const category = TAG_CATEGORIES[tag];
  
  switch (category) {
    case "school-level":
      return "bg-blue-200 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200";
    case "exams":
      return "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200";
    case "holidays":
      return "bg-green-200 text-green-900 dark:bg-green-900/60 dark:text-green-200";
    case "events":
      return "bg-purple-200 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200";
    case "staff-admin":
      return "bg-slate-200 text-slate-900 dark:bg-slate-800/60 dark:text-slate-200";
    case "due-dates":
      return "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200";
    case "students":
      return "bg-teal-200 text-teal-900 dark:bg-teal-900/60 dark:text-teal-200";
    case "parents":
      return "bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// Resolve a tag's display category by first checking TAG_CATEGORIES,
// then falling back to the event's DB-side category/type. This keeps
// badges consistent with the top filter pills even when a tag string
// from the DB isn't in our enum.
export function resolveBadgeCategory(
  tag: string | null | undefined,
  eventCategory?: string | null,
  eventType?: string | null
): TagCategory | null {
  if (tag && (TAG_CATEGORIES as Record<string, TagCategory>)[tag]) {
    return (TAG_CATEGORIES as Record<string, TagCategory>)[tag];
  }
  // Try reverse-lookup against display names ("Internal Event", "Field Trip", ...)
  if (tag) {
    const slug = DISPLAY_NAME_TO_TAG[tag.toLowerCase()];
    if (slug) return TAG_CATEGORIES[slug];
    // Try slugified form: "Internal Event" -> "internal-event"
    const slugified = tag.toLowerCase().trim().replace(/\s+/g, "-");
    if ((TAG_CATEGORIES as Record<string, TagCategory>)[slugified]) {
      return (TAG_CATEGORIES as Record<string, TagCategory>)[slugified];
    }
  }
  return mapDbToCategory(eventCategory || "", eventType || undefined);
}

// Returns Tailwind color classes matching the top filter pills.
export function getEventBadgeColor(
  tag: string | null | undefined,
  eventCategory?: string | null,
  eventType?: string | null
): string {
  const category = resolveBadgeCategory(tag, eventCategory, eventType);
  if (!category) return "bg-muted text-muted-foreground";
  return getCategoryColor(category);
}

// Returns a human label: known tag → display name, otherwise the raw tag/category text.
export function getEventBadgeLabel(
  tag: string | null | undefined,
  eventCategory?: string | null
): string {
  if (tag && (TAG_DISPLAY_NAMES as Record<string, string>)[tag]) {
    return (TAG_DISPLAY_NAMES as Record<string, string>)[tag];
  }
  if (tag) return tag;
  return eventCategory || "";
}

// Get color classes for a category
export function getCategoryColor(category: TagCategory): string {
  switch (category) {
    case "school-level":
      return "bg-blue-200 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200";
    case "exams":
      return "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200";
    case "holidays":
      return "bg-green-200 text-green-900 dark:bg-green-900/60 dark:text-green-200";
    case "events":
      return "bg-purple-200 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200";
    case "staff-admin":
      return "bg-slate-200 text-slate-900 dark:bg-slate-800/60 dark:text-slate-200";
    case "due-dates":
      return "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200";
    case "students":
      return "bg-teal-200 text-teal-900 dark:bg-teal-900/60 dark:text-teal-200";
    case "parents":
      return "bg-pink-200 text-pink-900 dark:bg-pink-900/60 dark:text-pink-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// Check if a tag is visible for a given role
export function isTagVisibleForRole(tag: CalendarTag, role: UserRole): boolean {
  if (role === "admin") {
    return true; // Admin sees everything
  }
  
  if (role === "teacher") {
    return !TEACHER_HIDDEN_TAGS.includes(tag);
  }
  
  if (role === "parent") {
    return !PARENT_HIDDEN_TAGS.includes(tag);
  }
  
  return true;
}

// Filter events based on user role
export function filterEventsByRole(events: CalendarEvent[], role: UserRole): CalendarEvent[] {
  if (role === "admin") {
    return events; // Admin sees all events
  }
  
  return events
    .map(event => {
      const originalTags = event.tags ?? [];
      // Filter out hidden tags for this role
      const visibleTags = originalTags.filter(tag => isTagVisibleForRole(tag, role));
      return { ...event, tags: visibleTags, _hadTags: originalTags.length > 0 } as CalendarEvent & { _hadTags: boolean };
    })
    // Drop events that originally had tags but every tag is hidden for this role.
    // Events with no tags at all (e.g. ad-hoc events created without categorization)
    // are kept so they remain visible.
    .filter(event => {
      const ev = event as CalendarEvent & { _hadTags: boolean };
      return !ev._hadTags || ev.tags.length > 0;
    })
    .map(({ _hadTags, ...rest }: any) => rest);
}

// Filter events by category
export function filterEventsByCategory(events: CalendarEvent[], category: TagCategory | "all"): CalendarEvent[] {
  if (category === "all") {
    return events;
  }
  
  return events.filter(event => 
    event.tags.some(tag => TAG_CATEGORIES[tag] === category)
  );
}

// Get all unique categories from events
export function getEventCategories(events: CalendarEvent[]): TagCategory[] {
  const categories = new Set<TagCategory>();
  
  events.forEach(event => {
    event.tags.forEach(tag => {
      categories.add(TAG_CATEGORIES[tag]);
    });
  });
  
  return Array.from(categories);
}

// Get all unique tags from events
export function getEventTags(events: CalendarEvent[]): CalendarTag[] {
  const tags = new Set<CalendarTag>();
  
  events.forEach(event => {
    event.tags.forEach(tag => {
      tags.add(tag);
    });
  });
  
  return Array.from(tags);
}

// All available categories for filtering
export const ALL_CATEGORIES: TagCategory[] = [
  "school-level",
  "exams",
  "holidays",
  "events",
  "staff-admin",
  "due-dates",
  "students",
  "parents",
];

// Get tags by category
export function getTagsByCategory(category: TagCategory): CalendarTag[] {
  return (Object.entries(TAG_CATEGORIES) as [CalendarTag, TagCategory][])
    .filter(([_, cat]) => cat === category)
    .map(([tag]) => tag);
}

// Filter events by specific tag
export function filterEventsByTag(events: CalendarEvent[], tag: CalendarTag | null): CalendarEvent[] {
  if (!tag) {
    return events;
  }
  
  return events.filter(event => event.tags.includes(tag));
}
