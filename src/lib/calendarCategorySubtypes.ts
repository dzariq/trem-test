// Calendar Category and Subtype Definitions
// This file defines the complete taxonomy for calendar event filtering

import type { CalendarTag, TagCategory } from "@/types/calendarTags";
import { TAG_DISPLAY_NAMES } from "@/types/calendarTags";

// Subtype options per category - maps to CalendarTag values
export const CATEGORY_SUBTYPES: Record<TagCategory, { value: CalendarTag | "all"; label: string }[]> = {
  "school-level": [
    { value: "all", label: "All School Levels" },
    { value: "preschool", label: "Preschool" },
    { value: "primary-school", label: "Primary School" },
    { value: "secondary-school", label: "Secondary School" },
  ],
  "exams": [
    { value: "all", label: "All Exams" },
    { value: "mid-year-exam", label: "Mid-Year Exam" },
    { value: "year-end-exam", label: "Year-End Exam" },
    { value: "cambridge-igcse", label: "Cambridge Exam – IGCSE" },
    { value: "cambridge-checkpoint", label: "Cambridge Exam – Checkpoint" },
  ],
  "holidays": [
    { value: "all", label: "All Holidays" },
    { value: "public-holiday", label: "Public Holiday" },
    { value: "replacement-public-holiday", label: "Replacement Public Holiday" },
    { value: "school-holiday-term-break", label: "School Holiday (Term Break)" },
  ],
  "events": [
    { value: "all", label: "All Events" },
    { value: "special-event-major", label: "Special Event (Major)" },
    { value: "internal-event", label: "Internal Event" },
    { value: "external-event", label: "External Event" },
    { value: "open-day", label: "Open Day" },
    { value: "field-trip", label: "Field Trip" },
  ],
  "staff-admin": [
    { value: "all", label: "All Staff & Admin" },
    { value: "staff-team-building", label: "Staff Team Building" },
    { value: "teacher-meeting", label: "Teacher Meeting" },
    { value: "admin-meeting", label: "Admin Meeting" },
    { value: "bog-meeting", label: "Board of Governors Meeting (BOG)" },
    { value: "back-to-school", label: "Back to School (BTS)" },
  ],
  "due-dates": [
    { value: "all", label: "All Due Dates" },
    { value: "teacher-due-date-primary", label: "Teacher Due Date (Primary)" },
    { value: "teacher-due-date-secondary", label: "Teacher Due Date (Secondary)" },
    { value: "admin-due-date", label: "Admin Due Date" },
  ],
  "students": [
    { value: "all", label: "All Students" },
    { value: "student-extra-classes", label: "Student Extra Classes" },
    { value: "student-enrichment-workshop", label: "Student Enrichment Workshop" },
  ],
  "parents": [
    { value: "all", label: "All Parents" },
    { value: "parent-teacher-conference", label: "Parent–Teacher Conference (PTC)" },
    { value: "parent-enrichment-workshop", label: "Parent Enrichment Workshop" },
    { value: "family-event", label: "Family Event (Parents Welcome)" },
  ],
};

// Categories that should show a dropdown (have more than just "all" option)
export const CATEGORIES_WITH_DROPDOWN: TagCategory[] = [
  "exams",
  "holidays",
  "events",
  "staff-admin",
  "due-dates",
  "students",
  "parents",
];

// Default category order for parent view (exclude staff-admin and due-dates)
export const PARENT_CATEGORY_ORDER: TagCategory[] = [
  "school-level",
  "exams",
  "holidays",
  "events",
  "students",
  "parents",
];

// Full category order for teacher/admin view
export const TEACHER_CATEGORY_ORDER: TagCategory[] = [
  "school-level",
  "exams",
  "holidays",
  "events",
  "staff-admin",
  "due-dates",
  "students",
  "parents",
];

// Get display label for a subtype within a category
export function getSubtypeLabel(category: TagCategory, subtype: CalendarTag | "all"): string {
  if (subtype === "all") {
    return CATEGORY_SUBTYPES[category]?.[0]?.label || "All";
  }
  return TAG_DISPLAY_NAMES[subtype] || subtype;
}

// Category pill styling
export const CATEGORY_PILL_STYLES: Record<TagCategory, string> = {
  "school-level": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  "exams": "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  "holidays": "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  "events": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  "students": "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
  "parents": "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
  "staff-admin": "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
  "due-dates": "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
};

// Map legacy DB category values to our tag system
export function mapDbCategoryToTag(dbCategory: string): CalendarTag | null {
  const normalized = (dbCategory || "").toLowerCase().trim();
  
  // Exams
  if (normalized.includes("mid-year") || normalized.includes("midyear")) return "mid-year-exam";
  if (normalized.includes("year-end") || normalized.includes("yearend") || normalized.includes("final")) return "year-end-exam";
  if (normalized.includes("igcse")) return "cambridge-igcse";
  if (normalized.includes("checkpoint")) return "cambridge-checkpoint";
  if (normalized.includes("exam") || normalized.includes("test") || normalized.includes("assessment")) return "mid-year-exam";
  
  // Holidays
  if (normalized.includes("replacement") && normalized.includes("holiday")) return "replacement-public-holiday";
  if (normalized.includes("public") && normalized.includes("holiday")) return "public-holiday";
  if (normalized.includes("term break") || normalized.includes("school holiday")) return "school-holiday-term-break";
  if (normalized.includes("holiday")) return "public-holiday";
  
  // Events
  if (normalized.includes("special") || normalized.includes("major")) return "special-event-major";
  if (normalized.includes("internal")) return "internal-event";
  if (normalized.includes("external")) return "external-event";
  if (normalized.includes("open day")) return "open-day";
  if (normalized.includes("field trip")) return "field-trip";
  
  // Staff & Admin
  if (normalized.includes("team building")) return "staff-team-building";
  if (normalized.includes("teacher meeting")) return "teacher-meeting";
  if (normalized.includes("admin meeting")) return "admin-meeting";
  if (normalized.includes("bog") || normalized.includes("board of governors")) return "bog-meeting";
  if (normalized.includes("bts") || normalized.includes("back to school")) return "back-to-school";
  
  // Due Dates
  if (normalized.includes("due") && normalized.includes("primary")) return "teacher-due-date-primary";
  if (normalized.includes("due") && normalized.includes("secondary")) return "teacher-due-date-secondary";
  if (normalized.includes("due") && normalized.includes("admin")) return "admin-due-date";
  
  // Students
  if (normalized.includes("extra class")) return "student-extra-classes";
  if (normalized.includes("student") && normalized.includes("workshop")) return "student-enrichment-workshop";
  
  // Parents
  if (normalized.includes("ptc") || normalized.includes("parent-teacher") || normalized.includes("parent teacher")) return "parent-teacher-conference";
  if (normalized.includes("parent") && normalized.includes("workshop")) return "parent-enrichment-workshop";
  if (normalized.includes("family")) return "family-event";
  
  return null;
}
