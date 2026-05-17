import { useMemo, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEventBadgeColor } from "@/lib/calendarUtils";
import { getCcaTypePillColor } from "@/components/cca/CcaTypeTabs";
import type { UpcomingEvent } from "@/data/calendar";
import type { CcaCalendarSession } from "@/hooks/useCcaSessionsCalendar";
import { CalendarViewDropdown, type CalendarViewMode } from "./CalendarViewSwitcher";

type ChipItem =
  | { kind: "event"; id: string; title: string; colorClass: string; sortKey: string; payload: UpcomingEvent }
  | { kind: "cca"; id: string; title: string; colorClass: string; sortKey: string; payload: CcaCalendarSession };

interface MonthGridCalendarProps {
  month: Date;
  selectedDay: string;
  onSelectDay: (ymd: string) => void;
  onMonthChange: (date: Date) => void;
  events: UpcomingEvent[];
  ccaSessions: CcaCalendarSession[];
  onEventClick?: (event: UpcomingEvent) => void;
  onSessionClick?: (session: CcaCalendarSession) => void;
  maxChipsPerDay?: number;
  view?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  onZoomToDay?: (ymd: string) => void;
  onOpenFilters?: () => void;
  hasActiveFilters?: boolean;
}

// Monday-first weekdays
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export function MonthGridCalendar({
  month,
  selectedDay,
  onSelectDay,
  onMonthChange,
  events,
  ccaSessions,
  onEventClick,
  onSessionClick,
  maxChipsPerDay = 3,
  view = "month",
  onViewChange,
  onZoomToDay,
  onOpenFilters,
  hasActiveFilters,
}: MonthGridCalendarProps) {
  const todayYmd = toYmd(new Date());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  // Build per-day buckets
  const buckets = useMemo(() => {
    const map = new Map<string, ChipItem[]>();
    const push = (key: string, item: ChipItem) => {
      const arr = map.get(key);
      if (arr) arr.push(item);
      else map.set(key, [item]);
    };

    events.forEach((event) => {
      if (!event.startDay) return;
      const start = parseYmd(event.startDay);
      const end = event.endDay ? parseYmd(event.endDay) : start;
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      const cursor = new Date(start);
      const sortKey = `${event.allDay ? "0" : "1"}_${event.time || ""}_${event.title || ""}`;
      while (cursor <= end) {
        push(toYmd(cursor), {
          kind: "event",
          id: String(event.id),
          title: event.title || "Event",
          colorClass: getEventBadgeColor(
            event.tags?.[0] != null ? String(event.tags[0]) : undefined,
            event.category,
            (event as any).eventType,
          ),
          sortKey,
          payload: event,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    ccaSessions.forEach((session) => {
      if (!session.sessionDate) return;
      const sortKey = `2_${session.startTime || ""}_${session.activityName || ""}`;
      push(session.sessionDate, {
        kind: "cca",
        id: session.id,
        title: session.customTitle || session.activityName || "CCA",
        colorClass: getCcaTypePillColor(session.category),
        sortKey,
        payload: session,
      });
    });

    map.forEach((arr) => arr.sort((a, b) => a.sortKey.localeCompare(b.sortKey)));
    return map;
  }, [events, ccaSessions]);

  // Build grid cells (Mon-first, always 6 weeks)
  const days = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstOfMonth = new Date(year, m, 1);
    // JS getDay: 0=Sun..6=Sat. We want Monday = 0.
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, m, 1 - startOffset);
    const cells: Array<{ date: Date; ymd: string; inMonth: boolean }> = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push({ date: d, ymd: toYmd(d), inMonth: d.getMonth() === m });
    }
    // Trim trailing all-outside weeks
    const weeks: typeof cells[] = [];
    for (let i = 0; i < 6; i++) weeks.push(cells.slice(i * 7, i * 7 + 7));
    while (weeks.length > 4 && weeks[weeks.length - 1].every((c) => !c.inMonth)) {
      weeks.pop();
    }
    return weeks.flat();
  }, [month]);

  const totalRows = days.length / 7;

  const goPrev = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const goNext = () => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));

  const handleMonthStripClick = (idx: number) => {
    onMonthChange(new Date(month.getFullYear(), idx, 1));
    setMonthPickerOpen(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-border bg-card">
        <button
            type="button"
            onClick={() => setMonthPickerOpen((v) => !v)}
            className="inline-flex items-center text-2xl sm:text-3xl font-semibold text-foreground truncate hover:opacity-80 transition-opacity min-w-0"
            aria-expanded={monthPickerOpen}
            aria-label="Toggle month picker"
          >
            <span className="truncate">{MONTH_SHORT[month.getMonth()].toUpperCase()}</span>
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {onViewChange && (
            <CalendarViewDropdown view={view} onChange={onViewChange} />
          )}
          {onOpenFilters && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="relative h-9 w-9 rounded-md shrink-0 [touch-action:manipulation]"
              onClick={onOpenFilters}
              aria-label="Filter events"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md [touch-action:manipulation]"
            onClick={goPrev}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md [touch-action:manipulation]"
            onClick={goNext}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          monthPickerOpen
            ? "max-h-[80px] opacity-100 border-b border-border"
            : "max-h-0 opacity-0",
        )}
      >
        <div className="px-3 py-2 bg-background overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [overscroll-behavior-x:contain]">
          <div className="flex items-center gap-1.5 min-w-max">
            {MONTH_SHORT.map((m, idx) => {
              const isActive = idx === month.getMonth();
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthStripClick(idx)}
                  className={cn(
                    "px-3 min-h-11 rounded-full text-xs font-medium transition-colors whitespace-nowrap no-callout [touch-action:manipulation]",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-background text-muted-foreground border border-border hover:bg-muted/50",
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7 px-0.5 pt-1.5 pb-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[13px] font-medium text-muted-foreground"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Grid cells */}
      <div className="grid grid-cols-7">
        {days.map(({ date, ymd, inMonth }, idx) => {
          const bucket = buckets.get(ymd) || [];
          const isToday = ymd === todayYmd;
          const isSelected = ymd === selectedDay;
          const overflowing = bucket.length > maxChipsPerDay;
          const visibleCount = Math.min(bucket.length, maxChipsPerDay);
          const visible = bucket.slice(0, visibleCount);
          const extra = bucket.length - visibleCount;

          const col = idx % 7;
          const row = Math.floor(idx / 7);
          const isLastCol = col === 6;
          const isLastRow = row === totalRows - 1;

          const handleCellClick = () => {
            if (!inMonth) {
              onMonthChange(new Date(date.getFullYear(), date.getMonth(), 1));
            }
            onSelectDay(ymd);
            onZoomToDay?.(ymd);
          };

          const handleChipClick = (e: MouseEvent, _item: ChipItem) => {
            e.stopPropagation();
            if (!inMonth) {
              onMonthChange(new Date(date.getFullYear(), date.getMonth(), 1));
            }
            onSelectDay(ymd);
            onZoomToDay?.(ymd);
          };

          return (
            <button
              key={ymd}
              type="button"
              onClick={handleCellClick}
              aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${bucket.length > 0 ? `, ${bucket.length} event${bucket.length === 1 ? "" : "s"}` : ", no events"}${isToday ? ", today" : ""}${isSelected ? ", selected" : ""}`}
              aria-pressed={isSelected}
              className={cn(
                "relative flex flex-col items-stretch text-left min-h-[104px] sm:min-h-[122px] p-0.5 m-px rounded-md transition-colors no-callout [touch-action:manipulation]",
                inMonth ? "bg-background" : "bg-muted/30",
                !isSelected && "hover:bg-muted/40",
              )}
            >
              <div className="flex items-center justify-between mb-1 gap-1">
                <span
                  className={cn(
                    "inline-flex items-center justify-center text-[11px] sm:text-xs font-medium leading-none w-5 h-5 rounded-full",
                    isToday && "bg-primary text-primary-foreground font-semibold",
                    !inMonth && "text-muted-foreground/60",
                    inMonth && !isToday && "text-foreground",
                  )}
                >
                  {date.getDate()}
                </span>
                {overflowing && extra > 0 && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay(ymd);
                      onZoomToDay?.(ymd);
                    }}
                    title={`+${extra} more`}
                    className="inline-flex items-center justify-center h-4 min-w-[18px] px-1 rounded-full text-[9px] font-semibold text-muted-foreground bg-muted/70 hover:bg-muted leading-none"
                  >
                    +{extra}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {visible.map((item) => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => handleChipClick(e, item)}
                    aria-label={item.title}
                    className={cn(
                      "h-[16px] text-[9px] sm:text-[10px] leading-[14px] font-medium truncate no-callout",
                      item.kind === "cca"
                        ? "flex items-center gap-1 px-1 rounded-full border"
                        : "px-0.5 rounded-[3px] border border-transparent",
                      item.colorClass,
                    )}
                  >
                    {item.kind === "cca" && (
                      <Users className="h-2.5 w-2.5 shrink-0 opacity-80" aria-hidden />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
