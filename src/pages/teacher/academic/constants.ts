// Grade categories with max scores
export const gradeCategories = [
  { key: "attitude", label: "Attitude", max: 10 },
  { key: "homework", label: "Homework", max: 10 },
  { key: "quiz", label: "Quiz", max: 10 },
  { key: "exam", label: "Exam", max: 70 },
];

// Academic years (past 6 years)
export const academicYears = ["2026", "2025", "2024", "2023", "2022", "2021"];

// Selection colors for multiple comparisons
export const SELECTION_COLORS = [
  { id: "A", bg: "bg-blue-50/50", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-700", hex: "#3b82f6", bgHex: "rgba(59, 130, 246, 0.08)", borderHex: "rgba(59, 130, 246, 0.25)" },
  { id: "B", bg: "bg-amber-50/50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700", hex: "#f59e0b", bgHex: "rgba(245, 158, 11, 0.08)", borderHex: "rgba(245, 158, 11, 0.25)" },
  { id: "C", bg: "bg-emerald-50/50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", hex: "#10b981", bgHex: "rgba(16, 185, 129, 0.08)", borderHex: "rgba(16, 185, 129, 0.25)" },
  { id: "D", bg: "bg-purple-50/50", border: "border-purple-200", dot: "bg-purple-500", text: "text-purple-700", hex: "#8b5cf6", bgHex: "rgba(139, 92, 246, 0.08)", borderHex: "rgba(139, 92, 246, 0.25)" },
  { id: "E", bg: "bg-rose-50/50", border: "border-rose-200", dot: "bg-rose-500", text: "text-rose-700", hex: "#f43f5e", bgHex: "rgba(244, 63, 94, 0.08)", borderHex: "rgba(244, 63, 94, 0.25)" },
  { id: "F", bg: "bg-cyan-50/50", border: "border-cyan-200", dot: "bg-cyan-500", text: "text-cyan-700", hex: "#06b6d4", bgHex: "rgba(6, 182, 212, 0.08)", borderHex: "rgba(6, 182, 212, 0.25)" },
];

// Subject colors for charts (violet, cyan, emerald, amber, red, pink)
export const SUBJECT_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

// Grade colors for charts
export const GRADE_COLORS: Record<string, string> = {
  "A*": "#059669",
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  E: "#ef4444",
};