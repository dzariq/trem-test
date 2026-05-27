export type YearKey = "2022" | "2023" | "2024" | "2025";
export type ExamType = "midYear" | "yearEnd";

export type AnalysisPeriod = {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  yearLabel: string;
  periodLabel: string;
  displayLabel: string;
  academicPeriodId: string | null;
  academicPeriodName: string | null;
  academicYear: number | null;
};

export const PERIOD_ORDER: readonly string[] = [
  "Mid Year Exam",
  "Trial (Checkpoint)",
  "Final Year Exam",
];

export const ANALYSIS_TAB_VALUES = ["overview", "trends", "comparison", "goals"] as const;
export type AnalysisTabValue = (typeof ANALYSIS_TAB_VALUES)[number];