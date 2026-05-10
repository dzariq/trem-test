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
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    case "exams":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    case "holidays":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case "events":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
    case "staff-admin":
      return "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300";
    case "due-dates":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";
    case "students":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300";
    case "parents":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300";
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
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    case "exams":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    case "holidays":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case "events":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
    case "staff-admin":
      return "bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300";
    case "due-dates":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";
    case "students":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300";
    case "parents":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300";
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
    .map(event => ({
      ...event,
      // Filter out hidden tags for this role
      tags: event.tags.filter(tag => isTagVisibleForRole(tag, role))
    }))
    // Only include events that still have at least one visible tag
    .filter(event => event.tags.length > 0);
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
