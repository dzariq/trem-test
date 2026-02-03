/**
 * Mapping between student year levels (Y1-Y11) and Key Stage codes (KS1-KS4)
 * Used for CCA year eligibility filtering.
 *
 * Key Stage Definitions:
 * - KS1: Years 1-2 (Primary Lower)
 * - KS2: Years 3-6 (Primary Upper)
 * - KS3: Years 7-9 (Secondary Lower)
 * - KS4: Years 10-11 (Secondary Upper)
 * - "All": Eligible for all year levels
 */

export type KeyStage = "KS1" | "KS2" | "KS3" | "KS4" | "All";
export type YearLevel = "Y1" | "Y2" | "Y3" | "Y4" | "Y5" | "Y6" | "Y7" | "Y8" | "Y9" | "Y10" | "Y11";

const YEAR_TO_KEY_STAGE: Record<YearLevel, KeyStage> = {
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
  KS1: ["Y1", "Y2"],
  KS2: ["Y3", "Y4", "Y5", "Y6"],
  KS3: ["Y7", "Y8", "Y9"],
  KS4: ["Y10", "Y11"],
  All: ["Y1", "Y2", "Y3", "Y4", "Y5", "Y6", "Y7", "Y8", "Y9", "Y10", "Y11"],
};

/**
 * Convert a student's year level (Y1-Y11) to Key Stage code (KS1-KS4).
 * @param yearLevel - Student's year level (e.g., "Y5")
 * @returns The corresponding Key Stage code or null if invalid
 */
export function yearLevelToKeyStage(yearLevel: string | null | undefined): KeyStage | null {
  if (!yearLevel) return null;
  const normalized = yearLevel.toUpperCase().trim() as YearLevel;
  return YEAR_TO_KEY_STAGE[normalized] ?? null;
}

/**
 * Check if a student is eligible for a CCA activity based on year level.
 * @param studentYearLevel - Student's year level (e.g., "Y5")
 * @param activityYearLevels - Array of Key Stage codes from the CCA activity (e.g., ["KS1", "KS2"])
 * @returns true if the student is eligible
 */
export function isStudentEligibleForCca(
  studentYearLevel: string | null | undefined,
  activityYearLevels: string[] | null | undefined
): boolean {
  // If no activity year levels defined, consider it open to all (fallback)
  if (!activityYearLevels || activityYearLevels.length === 0) {
    return true;
  }

  // If activity includes "All", everyone is eligible
  if (activityYearLevels.includes("All")) {
    return true;
  }

  // Get the student's Key Stage
  const studentKeyStage = yearLevelToKeyStage(studentYearLevel);
  if (!studentKeyStage) {
    // If student has no valid year level, they're not eligible
    return false;
  }

  // Check if any of the activity's year levels match the student's Key Stage
  return activityYearLevels.includes(studentKeyStage);
}

/**
 * Get all year levels that belong to given Key Stages.
 * @param keyStages - Array of Key Stage codes
 * @returns Array of year levels
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
 * @param keyStages - Array of Key Stage codes
 * @returns Human-readable string
 */
export function formatKeyStages(keyStages: string[] | null | undefined): string {
  if (!keyStages || keyStages.length === 0) return "All Years";
  if (keyStages.includes("All")) return "All Years";
  return keyStages.join(", ");
}
