// Calendar Tag System - Types and Visibility Rules

// All available calendar tags
export type CalendarTag =
  // School Level
  | "preschool"
  | "primary-school"
  | "secondary-school"
  // Exams
  | "mid-year-exam"
  | "year-end-exam"
  | "cambridge-igcse"
  | "cambridge-checkpoint"
  // Holidays
  | "public-holiday"
  | "replacement-public-holiday"
  | "school-holiday-term-break"
  // Events
  | "special-event-major"
  | "internal-event"
  | "external-event"
  | "open-day"
  | "field-trip"
  // Staff & Admin
  | "staff-team-building"
  | "teacher-meeting"
  | "admin-meeting"
  | "bog-meeting"
  | "back-to-school"
  // Due Dates
  | "teacher-due-date-primary"
  | "teacher-due-date-secondary"
  | "admin-due-date"
  // Students
  | "student-extra-classes"
  | "student-enrichment-workshop"
  // Parents
  | "parent-teacher-conference"
  | "parent-enrichment-workshop"
  | "family-event";

// Tag categories for grouping
export type TagCategory =
  | "school-level"
  | "exams"
  | "holidays"
  | "events"
  | "staff-admin"
  | "due-dates"
  | "students"
  | "parents";

// User roles for visibility
export type UserRole = "teacher" | "admin" | "parent" | "student";

// Tags hidden from teachers (admin-only)
export const TEACHER_HIDDEN_TAGS: CalendarTag[] = [
  "admin-meeting",
  "admin-due-date",
];

// Tags hidden from parents
export const PARENT_HIDDEN_TAGS: CalendarTag[] = [
  "staff-team-building",
  "teacher-meeting",
  "admin-meeting",
  "bog-meeting",
  "teacher-due-date-primary",
  "teacher-due-date-secondary",
  "admin-due-date",
];

// Tag to category mapping
export const TAG_CATEGORIES: Record<CalendarTag, TagCategory> = {
  // School Level
  "preschool": "school-level",
  "primary-school": "school-level",
  "secondary-school": "school-level",
  // Exams
  "mid-year-exam": "exams",
  "year-end-exam": "exams",
  "cambridge-igcse": "exams",
  "cambridge-checkpoint": "exams",
  // Holidays
  "public-holiday": "holidays",
  "replacement-public-holiday": "holidays",
  "school-holiday-term-break": "holidays",
  // Events
  "special-event-major": "events",
  "internal-event": "events",
  "external-event": "events",
  "open-day": "events",
  "field-trip": "events",
  // Staff & Admin
  "staff-team-building": "staff-admin",
  "teacher-meeting": "staff-admin",
  "admin-meeting": "staff-admin",
  "bog-meeting": "staff-admin",
  "back-to-school": "staff-admin",
  // Due Dates
  "teacher-due-date-primary": "due-dates",
  "teacher-due-date-secondary": "due-dates",
  "admin-due-date": "due-dates",
  // Students
  "student-extra-classes": "students",
  "student-enrichment-workshop": "students",
  // Parents
  "parent-teacher-conference": "parents",
  "parent-enrichment-workshop": "parents",
  "family-event": "parents",
};

// Display names for tags
export const TAG_DISPLAY_NAMES: Record<CalendarTag, string> = {
  // School Level
  "preschool": "Preschool",
  "primary-school": "Primary School",
  "secondary-school": "Secondary School",
  // Exams
  "mid-year-exam": "Mid-Year Exam",
  "year-end-exam": "Year-End Exam",
  "cambridge-igcse": "Cambridge Exam – IGCSE",
  "cambridge-checkpoint": "Cambridge Exam – Checkpoint",
  // Holidays
  "public-holiday": "Public Holiday",
  "replacement-public-holiday": "Replacement Public Holiday",
  "school-holiday-term-break": "School Holiday (Term Break)",
  // Events
  "special-event-major": "Special Event (Major)",
  "internal-event": "Internal Event",
  "external-event": "External Event",
  "open-day": "Open Day",
  "field-trip": "Field Trip",
  // Staff & Admin
  "staff-team-building": "Staff Team Building",
  "teacher-meeting": "Teacher Meeting",
  "admin-meeting": "Admin Meeting",
  "bog-meeting": "Board of Governors Meeting (BOG)",
  "back-to-school": "Back to School (BTS)",
  // Due Dates
  "teacher-due-date-primary": "Teacher Due Date (Primary)",
  "teacher-due-date-secondary": "Teacher Due Date (Secondary)",
  "admin-due-date": "Admin Due Date",
  // Students
  "student-extra-classes": "Student Extra Classes",
  "student-enrichment-workshop": "Student Enrichment Workshop",
  // Parents
  "parent-teacher-conference": "Parent-Teacher Conference (PTC)",
  "parent-enrichment-workshop": "Parent Enrichment Workshop",
  "family-event": "Family Event (Parents Welcome)",
};

// Display names for categories
export const CATEGORY_DISPLAY_NAMES: Record<TagCategory, string> = {
  "school-level": "School Level",
  "exams": "Exams",
  "holidays": "Holidays",
  "events": "Events",
  "staff-admin": "Staff & Admin",
  "due-dates": "Due Dates",
  "students": "Students",
  "parents": "Parents",
};

// Calendar event interface with multi-tag support
export interface CalendarEvent {
  id: string | number;
  title: string;
  date: string;
  time: string;
  tags: CalendarTag[];
  location?: string;
  startDay?: string;
  endDay?: string;
  allDay?: boolean;
  start?: Date | null;
  end?: Date | null;
  description?: string;
  category?: string;
}
