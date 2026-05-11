import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strip campus prefix (e.g. "GL-" or "BO-") from class names for display.
 * "GL-Y1A" → "Y1A", "BO-Y10S" → "Y10S", "Y1A" → "Y1A"
 */
export const stripCampusPrefix = (className: string): string => {
  if (!className) return '';
  return className.replace(/^(BO|GL)-/, '');
};

/**
 * Display a class name including its campus prefix (e.g. "BO-Y1C", "GL-Y1C").
 * If the raw value already includes a "BO-"/"GL-" prefix, returns it as-is.
 * Used for UI labels where the campus context should remain visible.
 */
export const formatClassDisplay = (className: string | null | undefined): string => {
  if (!className) return '';
  return className;
};
