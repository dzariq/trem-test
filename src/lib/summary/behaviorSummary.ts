type BehaviorBand = "excellent" | "good" | "needs_support";

export type BehaviorSummaryParams = {
  grades: Record<string, string | undefined | null>;
  seed: string;
};

export const letterToScore = (letter: string): number | null => {
  const normalized = letter.trim().toUpperCase();
  if (normalized === "A") return 4;
  if (normalized === "B") return 3;
  if (normalized === "C") return 2;
  if (normalized === "D") return 1;
  return null;
};

export const avgScore = (grades: Record<string, string | undefined | null>): number | null => {
  let total = 0;
  let count = 0;
  Object.values(grades).forEach((grade) => {
    if (!grade) return;
    const score = letterToScore(grade);
    if (score === null) return;
    total += score;
    count += 1;
  });
  return count === 0 ? null : total / count;
};

export const bandFromAvg = (avg: number): BehaviorBand => {
  if (avg >= 3.5) return "excellent";
  if (avg >= 2.5) return "good";
  return "needs_support";
};

export const stableHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const pickStable = (pool: string[], seed: string): string => {
  if (pool.length === 0) return "";
  const index = stableHash(seed) % pool.length;
  return pool[index];
};

const TEMPLATE_POOLS: Record<BehaviorBand, string[]> = {
  excellent: [
    "Consistently demonstrates strong behaviour and a positive attitude across indicators.",
    "Shows excellent self-management and works well with others throughout the term.",
    "Maintains high standards in responsibility, cooperation, and overall conduct.",
    "Demonstrates leadership qualities and strong self-control in daily routines.",
    "Displays outstanding consistency in behaviour and engagement across settings.",
    "Shows a highly positive behavioural profile with strong learning readiness."
  ],
  good: [
    "Demonstrates generally positive behaviour with good consistency across indicators.",
    "Shows good cooperation and responsibility, with some areas to strengthen further.",
    "Maintains a positive attitude overall and responds well to routines and expectations.",
    "Displays steady behaviour and engagement, with opportunities to improve consistency.",
    "Shows good self-control and cooperation in most situations throughout the term.",
    "Overall behavioural indicators are positive, with room for continued growth."
  ],
  needs_support: [
    "Shows potential, with behaviour indicators suggesting areas for improved consistency.",
    "Would benefit from additional guidance to strengthen routines and self-management.",
    "Behaviour indicators suggest a need for closer support in maintaining expectations.",
    "Shows progress in some areas, with further development needed across indicators.",
    "May require additional structure to improve consistency in daily conduct.",
    "Behaviour indicators highlight areas to focus on for improved learning readiness."
  ]
};

const FALLBACK_TEXT = "Behaviour indicators are not available for this report.";

export const generateBehaviorSummary = (
  params: BehaviorSummaryParams
): { band: string; text: string; score?: number } => {
  const average = avgScore(params.grades);
  if (average === null) {
    return { band: "unknown", text: FALLBACK_TEXT };
  }
  const band = bandFromAvg(average);
  const text = pickStable(TEMPLATE_POOLS[band], params.seed);
  return { band, text, score: average };
};
