import { cn } from "@/lib/utils";

const CAMPUS_COLORS: Record<string, string> = {
  BO: "bg-[#1D4ED8]",
  GL: "bg-[#15803D]",
};

interface CampusBadgeProps {
  code: string;
  size?: "sm" | "md";
  className?: string;
}

export function CampusBadge({ code, size = "sm", className }: CampusBadgeProps) {
  const bg = CAMPUS_COLORS[code] ?? "bg-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white",
        bg,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      {code}
    </span>
  );
}
