import { cn } from "@/lib/utils";

export type CalendarViewMode = "month" | "week" | "day";

interface CalendarViewSwitcherProps {
  view: CalendarViewMode;
  onChange: (view: CalendarViewMode) => void;
  className?: string;
}

const OPTIONS: { value: CalendarViewMode; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

export function CalendarViewSwitcher({ view, onChange, className }: CalendarViewSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Calendar view"
      className={cn(
        "inline-flex items-center rounded-full bg-muted/40 p-1 border border-border",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = view === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
