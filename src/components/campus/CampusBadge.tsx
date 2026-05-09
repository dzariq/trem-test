import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

// Outline pill styles per campus / combination
const SINGLE_STYLES: Record<string, string> = {
  BO: "bg-blue-50 text-blue-700 border-blue-300",
  GL: "bg-green-50 text-green-700 border-green-300",
};
const COMBO_STYLE = "bg-teal-50 text-teal-700 border-teal-300";
const FALLBACK_STYLE = "bg-muted text-muted-foreground border-border";

interface CampusBadgeProps {
  /** Single campus code (legacy) */
  code?: string;
  /** Multiple campus codes — renders e.g. "BO/GL" */
  codes?: string[];
  size?: "sm" | "md";
  className?: string;
}

export function CampusBadge({ code, codes, size = "sm", className }: CampusBadgeProps) {
  const list = (codes && codes.length > 0 ? codes : code ? [code] : []).filter(Boolean);
  if (list.length === 0) return null;

  const label = list.join("/");
  const style =
    list.length === 1
      ? SINGLE_STYLES[list[0]] ?? FALLBACK_STYLE
      : COMBO_STYLE;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border-2 font-semibold",
        style,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      <MapPin className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {label}
    </span>
  );
}
