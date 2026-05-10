import { useCampus } from "@/contexts/CampusContext";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

const ACTIVE_STYLES: Record<string, string> = {
  BO: "bg-blue-50 text-blue-700 border-blue-300",
  GL: "bg-green-50 text-green-700 border-green-300",
};
const INACTIVE_STYLE = "bg-transparent text-muted-foreground border-transparent hover:text-foreground";
const FALLBACK_ACTIVE = "bg-muted text-foreground border-border";

interface CampusToggleProps {
  size?: "sm" | "md";
  className?: string;
}

/**
 * Pill-style segmented toggle that lets a multi-campus teacher swap
 * their active campus from the header. Each segment shows the campus
 * code; the active one is highlighted with the campus colour.
 */
export function CampusToggle({ size = "sm", className }: CampusToggleProps) {
  const { campuses, activeCampus, setActiveCampus } = useCampus();

  if (campuses.length < 2) return null;

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";

  return (
    <div
      role="group"
      aria-label="Active campus"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border-2 border-border bg-background p-0.5",
        className
      )}
    >
      {campuses.map((campus) => {
        const isActive = campus.campus_code === activeCampus;
        const activeStyle = ACTIVE_STYLES[campus.campus_code] ?? FALLBACK_ACTIVE;
        return (
          <button
            key={campus.campus_code}
            type="button"
            onClick={() => setActiveCampus(campus.campus_code)}
            aria-pressed={isActive}
            title={campus.name}
            className={cn(
              "inline-flex items-center gap-1 rounded-sm border-2 font-semibold transition-colors",
              sizeClasses,
              isActive ? activeStyle : INACTIVE_STYLE
            )}
          >
            <MapPin className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
            {campus.campus_code}
          </button>
        );
      })}
    </div>
  );
}
