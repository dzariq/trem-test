import { useMemo, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEventBadgeColor } from "@/lib/calendarUtils";
import { getCcaTypeColor } from "@/components/cca/CcaTypeTabs";
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
        colorClass: getCcaTypeColor(session.category),
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

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-2 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="text-2xl sm:text-3xl font-semibold text-foreground truncate">
            {MONTH_NAMES[month.getMonth()]}
          </div>
          {onViewChange && (
            <CalendarViewDropdown view={view} onChange={onViewChange} />
          )}
          {onOpenFilters && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="relative h-8 w-8 rounded-md shrink-0"
              onClick={onOpenFilters}
              aria-label="Filter events"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={goPrev}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={goNext}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
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
              className={cn(
                "relative flex flex-col items-stretch text-left min-h-[115px] sm:min-h-[135px] p-1 m-0.5 rounded-md transition-colors",
                inMonth ? "bg-background" : "bg-muted/30",
                !isSelected && "hover:bg-muted/40",
              )}
            >
              {isSelected && (
                <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-inset ring-primary" />
              )}
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
                    title={item.title}
                    className={cn(
                      "h-[18px] px-1 rounded-[3px] text-[9px] sm:text-[10px] leading-[18px] font-medium truncate border-transparent",
                      item.colorClass,
                    )}
                  >
                    {item.title}
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
