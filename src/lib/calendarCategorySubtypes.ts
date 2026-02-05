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
  "exams",
  "holidays",
  "events",
  "students",
  "parents",
];

// Full category order for teacher/admin view
export const TEACHER_CATEGORY_ORDER: TagCategory[] = [
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

/**
 * Determines the top-level category from DB event_category field
 */
export function mapDbToCategory(eventCategory: string, eventType?: string): TagCategory | null {
  const cat = (eventCategory || "").toLowerCase().trim();
  const type = (eventType || "").toLowerCase().trim();
  
  // Exams
  if (cat === "exam" || cat === "examination" || type.includes("exam")) return "exams";
  
  // Holidays
  if (cat === "holiday" || type.includes("holiday") || type === "break") return "holidays";
  
  // Events
  if (cat === "event" || cat === "school events" || cat === "competition" || 
      cat === "sports" || cat === "cca" || cat === "field_trip" ||
      type === "school_event" || type === "social" || type === "sports" || type === "field_trip") return "events";
  
  // Staff & Admin
  if (cat === "admin" || cat === "meeting" || type === "meeting") return "staff-admin";
  
  // Students
  if (cat === "student_life" || type === "student") return "students";
  
  // Parents
  if (cat === "parent" || type === "parent") return "parents";
  
  // Academic is often a catch-all - try to parse from type
  if (cat === "academic") {
    if (type.includes("exam")) return "exams";
    if (type.includes("holiday")) return "holidays";
    if (type.includes("meeting")) return "staff-admin";
    // Default academic to events
    return "events";
  }
  
  return null;
}

/**
 * Determines the specific subtype from DB fields + title
 * This is used for filtering by specific exam/holiday/event types
 */
export function mapDbToSubtype(
  eventCategory: string, 
  eventType: string | undefined,
  title: string
): CalendarTag | null {
  const cat = (eventCategory || "").toLowerCase().trim();
  const type = (eventType || "").toLowerCase().trim();
  const titleLower = (title || "").toLowerCase();
  
  // ========== EXAMS ==========
  if (cat === "exam" || cat === "examination" || type.includes("exam")) {
    // Check title for specific exam type
    if (titleLower.includes("igcse") || titleLower.includes("ig ")) return "cambridge-igcse";
    if (titleLower.includes("checkpoint") || titleLower.includes("cp trial") || titleLower.includes("cp y")) return "cambridge-checkpoint";
    if (titleLower.includes("mid-year") || titleLower.includes("mye") || titleLower.includes("mid year")) return "mid-year-exam";
    if (titleLower.includes("year-end") || titleLower.includes("yee") || titleLower.includes("year end")) return "year-end-exam";
    // Check event_type for exam subtype hints
    if (type === "examination" || type === "exam") {
      // Default based on title patterns
      if (titleLower.includes("trial")) return "cambridge-igcse"; // Trial exams are usually Cambridge prep
    }
    // Fallback: if title has "ex1/ex2" patterns, try to classify
    if (titleLower.includes("ex1") || titleLower.includes("ex2")) return "mid-year-exam";
    if (titleLower.includes("ex3") || titleLower.includes("ex4")) return "year-end-exam";
    // Generic exam - default to mid-year
    return "mid-year-exam";
  }
  
  // ========== HOLIDAYS ==========
  if (cat === "holiday" || type.includes("holiday") || type === "break") {
    if (titleLower.includes("replacement")) return "replacement-public-holiday";
    if (titleLower.includes("term") || titleLower.includes("school holiday")) return "school-holiday-term-break";
    if (type === "public_holiday" || titleLower.includes("public")) return "public-holiday";
    if (type === "school_holiday" || titleLower.includes("break")) return "school-holiday-term-break";
    // Default holidays to public-holiday
    return "public-holiday";
  }
  
  // ========== EVENTS ==========
  if (cat === "event" || cat === "school events" || cat === "competition" || 
      cat === "sports" || cat === "cca" || type === "school_event" || type === "social") {
    if (titleLower.includes("open day")) return "open-day";
    if (cat === "field_trip" || titleLower.includes("field trip")) return "field-trip";
    if (titleLower.includes("special") || titleLower.includes("major")) return "special-event-major";
    if (titleLower.includes("external")) return "external-event";
    // Default events to internal-event
    return "internal-event";
  }
  
  // ========== FIELD TRIPS ==========
  if (cat === "field_trip" || type === "field_trip") {
    return "field-trip";
  }
  
  // ========== STAFF & ADMIN ==========
  if (cat === "admin" || cat === "meeting" || type === "meeting") {
    if (titleLower.includes("bog") || titleLower.includes("board of governors")) return "bog-meeting";
    if (titleLower.includes("bts") || titleLower.includes("back to school")) return "back-to-school";
    if (titleLower.includes("team building")) return "staff-team-building";
    if (titleLower.includes("admin")) return "admin-meeting";
    if (titleLower.includes("tsm") || titleLower.includes("teacher")) return "teacher-meeting";
    // AHM/OHM are usually teacher meetings
    if (titleLower.includes("ahm") || titleLower.includes("ohm")) return "teacher-meeting";
    // Default to teacher-meeting
    return "teacher-meeting";
  }
  
  // ========== STUDENTS ==========
  if (cat === "student_life" || type === "student") {
    if (titleLower.includes("extra class")) return "student-extra-classes";
    if (titleLower.includes("workshop") || titleLower.includes("enrichment")) return "student-enrichment-workshop";
    return "student-extra-classes";
  }
  
  // ========== PARENTS ==========
  if (cat === "parent" || type === "parent") {
    if (titleLower.includes("ptc") || titleLower.includes("conference")) return "parent-teacher-conference";
    if (titleLower.includes("workshop") || titleLower.includes("enrichment")) return "parent-enrichment-workshop";
    if (titleLower.includes("family")) return "family-event";
    return "parent-teacher-conference";
  }
  
  // ========== ACADEMIC (catch-all) ==========
  if (cat === "academic") {
    // Try to classify based on title
    if (titleLower.includes("exam") || titleLower.includes("mye") || titleLower.includes("yee")) {
      if (titleLower.includes("mid") || titleLower.includes("mye")) return "mid-year-exam";
      if (titleLower.includes("year-end") || titleLower.includes("yee")) return "year-end-exam";
      return "mid-year-exam";
    }
    if (titleLower.includes("holiday")) return "public-holiday";
    if (titleLower.includes("bts")) return "back-to-school";
    if (titleLower.includes("ptc")) return "parent-teacher-conference";
    if (titleLower.includes("ahm") || titleLower.includes("ohm") || titleLower.includes("tsm") || titleLower.includes("meeting")) return "teacher-meeting";
    if (titleLower.includes("orientation")) return "internal-event";
    // Default academic to internal-event
    return "internal-event";
  }
  
  return null;
}

// Legacy function for backwards compatibility
export function mapDbCategoryToTag(dbCategory: string, title?: string): CalendarTag | null {
  return mapDbToSubtype(dbCategory, undefined, title || "");
}
