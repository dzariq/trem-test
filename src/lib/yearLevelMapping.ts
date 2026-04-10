/**
 * Mapping between student year levels and Key Stage codes
 * Used for CCA year eligibility filtering.
 *
 * Key Stage Definitions:
 * - EYFS: Nursery & Reception (Early Years Foundation Stage)
 * - KS1: Years 1-2 (Primary Lower)
 * - KS2: Years 3-6 (Primary Upper)
 * - KS3: Years 7-9 (Secondary Lower)
 * - KS4: Years 10-11 (Secondary Upper)
 * - "All": Eligible for all year levels
 */

export type KeyStage = "EYFS" | "KS1" | "KS2" | "KS3" | "KS4" | "All";
export type YearLevel = "Nursery" | "Reception" | "Y1" | "Y2" | "Y3" | "Y4" | "Y5" | "Y6" | "Y7" | "Y8" | "Y9" | "Y10" | "Y11";

const YEAR_TO_KEY_STAGE: Record<YearLevel, KeyStage> = {
  Nursery: "EYFS",
  Reception: "EYFS",
  Y1: "KS1",
  Y2: "KS1",
  Y3: "KS2",
  Y4: "KS2",
  Y5: "KS2",
  Y6: "KS2",
  Y7: "KS3",
  Y8: "KS3",
  Y9: "KS3",
  Y10: "KS4",
  Y11: "KS4",
};

const KEY_STAGE_YEAR_LEVELS: Record<KeyStage, YearLevel[]> = {
  EYFS: ["Nursery", "Reception"],
  KS1: ["Y1", "Y2"],
  KS2: ["Y3", "Y4", "Y5", "Y6"],
  KS3: ["Y7", "Y8", "Y9"],
  KS4: ["Y10", "Y11"],
  All: ["Nursery", "Reception", "Y1", "Y2", "Y3", "Y4", "Y5", "Y6", "Y7", "Y8", "Y9", "Y10", "Y11"],
};

/**
 * Canonical year level ordering used for consistent sorting.
 * Nursery → Reception → Y1 → ... → Y11
 */
export const YEAR_LEVEL_ORDER: readonly string[] = [
  "Nursery", "Reception",
  "Y1", "Y2", "Y3", "Y4", "Y5", "Y6",
  "Y7", "Y8", "Y9", "Y10", "Y11",
] as const;

/**
 * Canonical class-suffix ordering: C → I → S → A → B
 */
export const CLASS_SUFFIX_ORDER = ["C", "I", "S", "A", "B"] as const;

/**
 * Get the sort rank for a year level string.
 * Returns a large number for unknown values so they sort last.
 */
export function getYearLevelRank(yearLevel: string): number {
  const normalized = yearLevel.trim();
  const idx = YEAR_LEVEL_ORDER.indexOf(normalized);
  return idx >= 0 ? idx : 999;
}

/**
 * Get the sort rank for a class suffix (last letter of class name).
 * Enforces C → I → S → A → B ordering.
 */
export function getClassSuffixRank(suffix: string): number {
  const idx = CLASS_SUFFIX_ORDER.indexOf(suffix.toUpperCase() as typeof CLASS_SUFFIX_ORDER[number]);
  return idx >= 0 ? idx : 999;
}

/**
 * Convert a student's year level to Key Stage code.
 * Handles Nursery, Reception, and Y1-Y11.
 */
export function yearLevelToKeyStage(yearLevel: string | null | undefined): KeyStage | null {
  if (!yearLevel) return null;
  const trimmed = yearLevel.trim();
  // Handle case-insensitive match for Nursery/Reception
  if (trimmed.toLowerCase() === "nursery") return "EYFS";
  if (trimmed.toLowerCase() === "reception") return "EYFS";
  const normalized = trimmed.toUpperCase() as YearLevel;
  return YEAR_TO_KEY_STAGE[normalized] ?? null;
}

/**
 * Check if a student is eligible for a CCA activity based on year level.
 */
export function isStudentEligibleForCca(
  studentYearLevel: string | null | undefined,
  activityYearLevels: string[] | null | undefined
): boolean {
  if (!activityYearLevels || activityYearLevels.length === 0) {
    return true;
  }
  if (activityYearLevels.includes("All")) {
    return true;
  }
  const studentKeyStage = yearLevelToKeyStage(studentYearLevel);
  if (!studentKeyStage) {
    return false;
  }
  return activityYearLevels.includes(studentKeyStage);
}

/**
 * Get all year levels that belong to given Key Stages.
 */
export function getYearLevelsForKeyStages(keyStages: string[]): YearLevel[] {
  const yearLevels = new Set<YearLevel>();
  for (const ks of keyStages) {
    const levels = KEY_STAGE_YEAR_LEVELS[ks as KeyStage];
    if (levels) {
      levels.forEach((level) => yearLevels.add(level));
    }
  }
  return Array.from(yearLevels);
}

/**
 * Format Key Stage codes for display.
 */
export function formatKeyStages(keyStages: string[] | null | undefined): string {
  if (!keyStages || keyStages.length === 0) return "All Years";
  if (keyStages.includes("All")) return "All Years";
  return keyStages.join(", ");
}
