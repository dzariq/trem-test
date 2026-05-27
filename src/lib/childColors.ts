/**
 * Stable per-child color palette.
 *
 * Each linked child is assigned one of these palettes based on their position
 * in the parent's `linkedStudents` list (sorted by id for stability across
 * sessions). Use the helpers below anywhere a child name/tag is rendered so
 * the same child always gets the same color throughout the app.
 */

export type ChildColorClasses = {
  /** Tailwind classes for a soft pill / badge background */
  badge: string;
  /** Tailwind classes for a solid dot / avatar accent */
  dot: string;
};

const PALETTE: ChildColorClasses[] = [
  // Child 1 — Rose
  { badge: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" },
  // Child 2 — Sky
  { badge: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  // Child 3 — Emerald
  { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  // Child 4 — Amber
  { badge: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  // Child 5 — Violet
  { badge: "bg-violet-100 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  // Child 6 — Teal
  { badge: "bg-teal-100 text-teal-800 border-teal-200", dot: "bg-teal-500" },
];

const FALLBACK: ChildColorClasses = {
  badge: "bg-secondary/40 text-foreground border-border",
  dot: "bg-muted-foreground",
};

/**
 * Build a stable studentId -> color map from the parent's linked students.
 * Sort by id so order is deterministic regardless of fetch order.
 */
export function buildChildColorMap(
  linkedStudents: { id: string }[]
): Record<string, ChildColorClasses> {
  const sorted = [...linkedStudents].sort((a, b) => a.id.localeCompare(b.id));
  const map: Record<string, ChildColorClasses> = {};
  sorted.forEach((s, i) => {
    map[s.id] = PALETTE[i % PALETTE.length];
  });
  return map;
}

export function getChildColor(
  studentId: string | null | undefined,
  map: Record<string, ChildColorClasses>
): ChildColorClasses {
  if (!studentId) return FALLBACK;
  return map[studentId] ?? FALLBACK;
}