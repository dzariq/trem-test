import { SELECTION_COLORS } from "./constants";

export interface StudentGrades {
  attitude: string;
  homework: string;
  quiz: string;
  exam: string;
  comment: string;
  reportComment: string;
  studyRecommendation: string;
}

export const getSelectionColor = (index: number) =>
  SELECTION_COLORS[index % SELECTION_COLORS.length];

export const getNextSelectionId = (existingIds: string[]) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < letters.length; i++) {
    if (!existingIds.includes(letters[i])) return letters[i];
  }
  return `${letters.length + 1}`;
};

export const calculateTotal = (grades: StudentGrades): number => {
  return (
    (parseInt(grades.attitude) || 0) +
    (parseInt(grades.homework) || 0) +
    (parseInt(grades.quiz) || 0) +
    (parseInt(grades.exam) || 0)
  );
};

export const getLetterGrade = (total: number): { grade: string; color: string } => {
  if (total >= 90) return { grade: "A*", color: "bg-emerald-100 text-emerald-700 border-emerald-300" };
  if (total >= 80) return { grade: "A", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  if (total >= 70) return { grade: "B", color: "bg-blue-100 text-blue-700 border-blue-300" };
  if (total >= 60) return { grade: "C", color: "bg-amber-100 text-amber-700 border-amber-300" };
  if (total >= 50) return { grade: "D", color: "bg-orange-100 text-orange-700 border-orange-300" };
  return { grade: "E", color: "bg-red-100 text-red-700 border-red-300" };
};

export const formatSavedAt = (value?: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" });
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  return `${day} ${month}, ${hour12}:${minutes}${period}`;
};