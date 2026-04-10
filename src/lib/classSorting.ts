/**
 * Shared class and year-level sorting helpers for the mobile app.
 *
 * Year-level order: Nursery → Reception → Y1 → … → Y11
 * Class-suffix order within each year level: C → I → S → A → B
 */

import { getYearLevelRank, getClassSuffixRank } from "@/lib/yearLevelMapping";
import { stripCampusPrefix } from "@/lib/utils";

/**
 * Sort year-level strings in canonical order:
 * Nursery, Reception, Y1, Y2, …, Y11
 */
export function sortYearLevels(levels: string[]): string[] {
  return [...levels].sort((a, b) => getYearLevelRank(a) - getYearLevelRank(b));
}

/**
 * Parse a (display) class name into its year-level prefix and suffix letter.
 *
 * After campus-prefix stripping the patterns are:
 *   "NC" → { prefix: "N", num: -2, suffix: "C" }
 *   "RC" → { prefix: "R", num: -1, suffix: "C" }
 *   "Y7C" → { prefix: "Y7", num: 7, suffix: "C" }
 *
 * Returns a comparable tuple for sorting.
 */
function parseClassName(raw: string): { rank: number; suffix: string } {
  const name = stripCampusPrefix(raw);

  // Nursery: N + suffix
  if (/^N[A-Z]$/i.test(name)) {
    return { rank: getYearLevelRank("Nursery"), suffix: name.slice(-1) };
  }
  // Reception: R + suffix
  if (/^R[A-Z]$/i.test(name)) {
    return { rank: getYearLevelRank("Reception"), suffix: name.slice(-1) };
  }
  // Year classes: Y<number><suffix>
  const m = name.match(/^Y(\d+)([A-Z])$/i);
  if (m) {
    return { rank: getYearLevelRank(`Y${m[1]}`), suffix: m[2].toUpperCase() };
  }

  // Fallback
  return { rank: 9999, suffix: name };
}

/**
 * Sort class names in canonical order.
 *
 * Primary sort: year-level rank (Nursery → Reception → Y1 … Y11)
 * Secondary sort: suffix rank (C → I → S → A → B)
 *
 * Handles raw DB names (GL-Y7C) and display names (Y7C) transparently.
 */
export function sortClasses(classes: string[]): string[] {
  return [...classes].sort((a, b) => {
    const pa = parseClassName(a);
    const pb = parseClassName(b);
    if (pa.rank !== pb.rank) return pa.rank - pb.rank;
    return getClassSuffixRank(pa.suffix) - getClassSuffixRank(pb.suffix);
  });
}
