import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type CalendarViewMode = "month" | "week" | "day";

const LABELS: Record<CalendarViewMode, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
};

const OPTIONS: CalendarViewMode[] = ["month", "week", "day"];

interface CalendarViewDropdownProps {
  view: CalendarViewMode;
  onChange: (view: CalendarViewMode) => void;
  className?: string;
}

export function CalendarViewDropdown({ view, onChange, className }: CalendarViewDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 h-8 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors",
          className,
        )}
      >
        {LABELS[view]}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onSelect={() => onChange(opt)}
            className={cn(
              "text-sm cursor-pointer",
              view === opt && "font-semibold bg-accent",
            )}
          >
            {LABELS[opt]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Backwards-compatible export so existing imports keep working
export const CalendarViewSwitcher = CalendarViewDropdown;
