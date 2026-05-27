/**
 * Calendar taxonomy + color resolver mirrored from the admin
 * web project (collinz-app-school) so chip colors match across apps.
 */

import type * as React from "react";

export interface TaxonomySubtype {
  name: string;
  color: string;
}

export interface TaxonomyGroup {
  name: string;
  color: string;
  subtypes: TaxonomySubtype[];
}

export const CALENDAR_TAXONOMY: TaxonomyGroup[] = [
  {
    name: "Exams",
    color: "#dc2626",
    subtypes: [
      { name: "Collinz Exam", color: "#dc2626" },
      { name: "Cambridge Exam", color: "#b91c1c" },
      { name: "Mid-Year Exam", color: "#dc2626" },
      { name: "Year-End Exam", color: "#b91c1c" },
      { name: "Cambridge Exam – IGCSE", color: "#b91c1c" },
      { name: "Cambridge Exam – Checkpoint", color: "#7f1d1d" },
    ],
  },
  {
    name: "Holidays",
    color: "#22c55e",
    subtypes: [
      { name: "Public Holiday", color: "#22c55e" },
      { name: "Replacement Public Holiday", color: "#16a34a" },
      { name: "School Holiday (Term Break)", color: "#15803d" },
    ],
  },
  {
    name: "Events",
    color: "#8b5cf6",
    subtypes: [
      { name: "Special Event (Major)", color: "#7c3aed" },
      { name: "Internal Event", color: "#8b5cf6" },
      { name: "External Event", color: "#6d28d9" },
      { name: "Open Day", color: "#a78bfa" },
      { name: "Field Trip", color: "#5b21b6" },
    ],
  },
  {
    name: "Staff & Admin",
    color: "#f97316",
    subtypes: [
      { name: "Staff Team Building", color: "#f97316" },
      { name: "Teacher Meeting", color: "#fb923c" },
      { name: "Admin Meeting", color: "#ea580c" },
      { name: "Board of Governors Meeting (BOG)", color: "#c2410c" },
      { name: "Back to School (BTS)", color: "#fdba74" },
    ],
  },
  {
    name: "Due Dates",
    color: "#f43f5e",
    subtypes: [
      { name: "Teacher Due Date (Primary)", color: "#f43f5e" },
      { name: "Teacher Due Date (Secondary)", color: "#e11d48" },
      { name: "Admin Due Date", color: "#be123c" },
    ],
  },
  {
    name: "Students",
    color: "#06b6d4",
    subtypes: [
      { name: "Student Extra Classes", color: "#06b6d4" },
      { name: "Student Enrichment Workshop", color: "#0891b2" },
    ],
  },
  {
    name: "Parents",
    color: "#ec4899",
    subtypes: [
      { name: "Parent-Teacher Conference (PTC)", color: "#ec4899" },
      { name: "Parent–Teacher Conference (PTC)", color: "#ec4899" },
      { name: "Parent Enrichment Workshop", color: "#db2777" },
      { name: "Family Event (Parents Welcome)", color: "#be185d" },
    ],
  },
];

export const DEFAULT_EVENT_COLOR = "#64748b";

/** Exact-match subtype lookup. */
export const getSubtypeColor = (name: string | null | undefined): string => {
  if (!name) return DEFAULT_EVENT_COLOR;
  const normalized = name.trim().toLowerCase();
  for (const group of CALENDAR_TAXONOMY) {
    const subtype = group.subtypes.find((s) => s.name.toLowerCase() === normalized);
    if (subtype) return subtype.color;
  }
  return DEFAULT_EVENT_COLOR;
};

/**
 * Fuzzy keyword-based category color so events authored with free-text
 * category names (e.g. "PH", "MYE", "TSM", "Open Day") still render
 * with the right group color instead of falling back to grey.
 */
export const getCategoryGroupColor = (
  category: string | null | undefined,
  title?: string | null
): string => {
  const c = (category || "").toLowerCase().trim();
  const t = (title || "").toLowerCase().trim();
  const blob = `${c} ${t}`;

  // Exams
  if (
    /\b(exam|examination|cambridge|igcse|checkpoint|mye|yee|y\d-?\d* mye|mid-?year|year-?end)\b/.test(blob)
  ) {
    return "#dc2626";
  }

  // Holidays — match "PH", "Public Holiday", "Hari Raya", "Wesak", "break"
  if (
    /\b(public holiday|replacement|school holiday|term break|holiday|break|labour day|wesak|hari raya|deepavali|christmas|chinese new year|cny|\bph\b|ph\s?\d)/.test(
      blob
    )
  ) {
    return "#22c55e";
  }

  // Parents
  if (/\b(parent|ptc|family event)\b/.test(blob)) return "#ec4899";

  // Due dates
  if (/\b(due|deadline)\b/.test(blob)) return "#f43f5e";

  // Students
  if (/\b(student|enrichment|extra class)\b/.test(blob)) return "#06b6d4";

  // Staff & Admin — TSM/AHM/OHM/Workshop/Meeting/Admin/Staff/BOG/BTS/Term Start
  if (
    /\b(meeting|admin|staff|bog|bts|back to school|tsm|ahm|ohm|workshop|term \d+ start|term start|orientation)\b/.test(
      blob
    )
  ) {
    return "#f97316";
  }

  // Events — open day, field trip, competition, community, social, sports
  if (
    /\b(open day|field trip|trip|competition|community|comm\.|social|sports|event|cca|fair|carnival|concert|performance)\b/.test(
      blob
    )
  ) {
    return "#8b5cf6";
  }

  return DEFAULT_EVENT_COLOR;
};

/** Resolve a saturated hex color for any event in priority order. */
export const resolveEventHex = (input: {
  fkColor?: string | null;
  tag?: string | null;
  category?: string | null;
  title?: string | null;
}): string => {
  if (input.fkColor && /^#?[0-9a-f]{3,8}$/i.test(input.fkColor)) {
    return input.fkColor.startsWith("#") ? input.fkColor : `#${input.fkColor}`;
  }
  if (input.tag) {
    const sub = getSubtypeColor(input.tag);
    if (sub !== DEFAULT_EVENT_COLOR) return sub;
  }
  // Title lookup against subtype names (e.g. "Internal Event")
  if (input.title) {
    const sub = getSubtypeColor(input.title);
    if (sub !== DEFAULT_EVENT_COLOR) return sub;
  }
  const group = getCategoryGroupColor(input.category, input.title);
  if (group !== DEFAULT_EVENT_COLOR) return group;
  return DEFAULT_EVENT_COLOR;
};

/** Pick black/white text for legibility on a given hex background. */
export const getReadableTextColor = (hex: string): string => {
  const h = hex.replace("#", "");
  const norm = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  // Perceived luminance
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "#0f172a" : "#ffffff";
};

/**
 * Produce inline chip styles (translucent bg, colored border, readable text)
 * matching the reference calendar's saturated pill look.
 */
export const getEventChipStyle = (hex: string): React.CSSProperties => {
  const safe = hex || DEFAULT_EVENT_COLOR;
  return {
    backgroundColor: safe,
    color: "#ffffff",
    borderColor: safe,
  };
};