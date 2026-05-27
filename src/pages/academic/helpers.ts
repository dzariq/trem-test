import { academicData } from "@/data/mockData";
import { PERIOD_ORDER, type YearKey, type ExamType } from "./constants";

export const getPeriodOrderIndex = (name: string) => {
  const index = PERIOD_ORDER.indexOf(name);
  return index === -1 ? PERIOD_ORDER.length : index;
};

export const safeNumber = (value: number | null | undefined, fallback = 0) => {
  return Number.isFinite(value) ? (value as number) : fallback;
};

export const safePercent = (value: number | null | undefined, fallback = 0) => {
  const safe = safeNumber(value, fallback);
  return Math.min(100, Math.max(0, safe));
};

export const safeText = (value: number | null | undefined, fallback = "—") => {
  return Number.isFinite(value) ? String(value) : fallback;
};

// Helper to get score from data structure
export const getScore = (
  subject: typeof academicData.subjects[0],
  year: YearKey,
  examType: ExamType,
) => {
  const yearData = subject.scores[year];
  return yearData ? yearData[examType] : null;
};