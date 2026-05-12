import { useMemo, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEventBadgeColor } from "@/lib/calendarUtils";
import { getCcaTypeColor } from "@/components/cca/CcaTypeTabs";
import type { UpcomingEvent } from "@/data/calendar";
import type { CcaCalendarSession } from "@/hooks/useCcaSessionsCalendar";
import { CalendarViewDropdown, type CalendarViewMode } from "./CalendarViewSwitcher";

export type TimeGridMode = "week" | "day";

interface TimeGridCalendarProps {
  mode: TimeGridMode;
  /** Reference date: for "week" any date in that week; for "day" the date itself */
  date: Date;
  selectedDay: string;
  onSelectDay: (ymd: string) => void;
  onDateChange: (date: Date) => void;
  events: UpcomingEvent[];
  ccaSessions: CcaCalendarSession[];
  onEventClick?: (event: UpcomingEvent) => void;
  onSessionClick?: (session: CcaCalendarSession) => void;
  startHour?: number;
  endHour?: number;
  view?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  onBackToMonth?: () => void;
  onOpenFilters?: () => void;
  hasActiveFilters?: boolean;
}

const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

/** Get Monday of the week containing `d` */
const startOfWeek = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (date.getDay() + 6) % 7; // Mon = 0
  date.setDate(date.getDate() - offset);
  return date;
};

type Block =
  | { kind: "event"; id: string; title: string; colorClass: string; startMin: number; endMin: number; payload: UpcomingEvent }
  | { kind: "cca"; id: string; title: string; colorClass: string; startMin: number; endMin: number; payload: CcaCalendarSession };

const parseHHMM = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const [h, m] = s.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
};

export function TimeGridCalendar({
  mode,
  date,
  selectedDay,
  onSelectDay,
  onDateChange,
  events,
  ccaSessions,
  onEventClick,
  onSessionClick,
  startHour = 7,
  endHour = 19,
  view,
  onViewChange,
  onBackToMonth,
  onOpenFilters,
  hasActiveFilters,
}: TimeGridCalendarProps) {
  const todayYmd = toYmd(new Date());
  const HOUR_PX = mode === "day" ? 72 : 48;
  const totalHours = endHour - startHour;
  const totalHeight = totalHours * HOUR_PX;

  const days = useMemo(() => {
    if (mode === "day") {
      return [{ date: new Date(date), ymd: toYmd(date) }];
    }
    const start = startOfWeek(date);
    const out: { date: Date; ymd: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push({ date: d, ymd: toYmd(d) });
    }
    return out;
  }, [date, mode]);

  // Build per-day all-day items + timed items
  const { allDayByDay, timedByDay } = useMemo(() => {
    const allDay = new Map<string, Block[]>();
    const timed = new Map<string, Block[]>();
    const pushAllDay = (key: string, b: Block) => {
      const arr = allDay.get(key);
      if (arr) arr.push(b);
      else allDay.set(key, [b]);
    };
    const pushTimed = (key: string, b: Block) => {
      const arr = timed.get(key);
      if (arr) arr.push(b);
      else timed.set(key, [b]);
    };

    const dayKeys = new Set(days.map((d) => d.ymd));

    events.forEach((event) => {
      if (!event.startDay) return;
      const start = parseYmd(event.startDay);
      const end = event.endDay ? parseYmd(event.endDay) : start;
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      const colorClass = getEventBadgeColor(
        event.tags?.[0] != null ? String(event.tags[0]) : undefined,
        event.category,
        (event as any).eventType,
      );
      const hasTime =
        !event.allDay && event.start instanceof Date && !Number.isNaN(event.start.getTime());
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = toYmd(cursor);
        if (dayKeys.has(key)) {
          if (hasTime && event.start) {
            const startMin = event.start.getHours() * 60 + event.start.getMinutes();
            const endMin = event.end
              ? event.end.getHours() * 60 + event.end.getMinutes()
              : startMin + 60;
            pushTimed(key, {
              kind: "event",
              id: String(event.id),
              title: event.title || "Event",
              colorClass,
              startMin,
              endMin: Math.max(endMin, startMin + 30),
              payload: event,
            });
          } else {
            pushAllDay(key, {
              kind: "event",
              id: String(event.id),
              title: event.title || "Event",
              colorClass,
              startMin: 0,
              endMin: 0,
              payload: event,
            });
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    ccaSessions.forEach((session) => {
      if (!session.sessionDate || !dayKeys.has(session.sessionDate)) return;
      const startMin = parseHHMM(session.startTime);
      const endMin = parseHHMM(session.endTime);
      const colorClass = getCcaTypeColor(session.category);
      const block: Block = {
        kind: "cca",
        id: session.id,
        title: session.customTitle || session.activityName || "CCA",
        colorClass,
        startMin: startMin ?? 0,
        endMin: endMin ?? (startMin != null ? startMin + 60 : 0),
        payload: session,
      };
      if (startMin == null) {
        pushAllDay(session.sessionDate, block);
      } else {
        pushTimed(session.sessionDate, block);
      }
    });

    return { allDayByDay: allDay, timedByDay: timed };
  }, [events, ccaSessions, days]);

  const handleBlockClick = (e: MouseEvent, block: Block, ymd: string) => {
    e.stopPropagation();
    onSelectDay(ymd);
    if (block.kind === "event") onEventClick?.(block.payload);
    else onSessionClick?.(block.payload);
  };

  const goPrev = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - (mode === "week" ? 7 : 1));
    onDateChange(d);
    if (mode === "day") onSelectDay(toYmd(d));
  };
  const goNext = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + (mode === "week" ? 7 : 1));
    onDateChange(d);
    if (mode === "day") onSelectDay(toYmd(d));
  };

  const headerLabel = useMemo(() => {
    if (mode === "day") {
      return MONTH_NAMES[date.getMonth()];
    }
    const start = days[0].date;
    const end = days[6].date;
    const sameMonth = start.getMonth() === end.getMonth();
    if (sameMonth) {
      return MONTH_NAMES[start.getMonth()];
    }
    return `${MONTH_NAMES[start.getMonth()]} – ${MONTH_NAMES[end.getMonth()]}`;
  }, [days, mode, date]);

  // Layout: time gutter (48px) + N day columns
  const GUTTER = 44;
  const colMinWidth = mode === "day" ? "1fr" : "minmax(64px, 1fr)";
  const gridTemplate = `${GUTTER}px repeat(${days.length}, ${colMinWidth})`;

  // Max all-day rows across visible days (capped)
  const maxAllDay = Math.min(
    3,
    days.reduce((mx, d) => Math.max(mx, (allDayByDay.get(d.ymd) || []).length), 0),
  );
  const allDayRowHeight = 29;
  const allDayBlockHeight = maxAllDay > 0 ? maxAllDay * allDayRowHeight + 6 : 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-2 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 min-w-0">
          {onBackToMonth && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md shrink-0"
              onClick={onBackToMonth}
              aria-label="Back to month view"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="text-2xl sm:text-3xl font-semibold text-foreground truncate">
            {headerLabel}
          </div>
          {onViewChange && (
            <CalendarViewDropdown view={view ?? (mode as CalendarViewMode)} onChange={onViewChange} />
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
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={goNext}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable area */}
      <div className={mode === "week" ? "overflow-x-auto" : "overflow-visible"}>
        <div style={{ minWidth: mode === "week" ? 560 : undefined }}>
          {/* Day header row — floating, no background, today inside filled circle */}
          <div
            className="grid pt-2 pb-3"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div />
            {days.map((d) => {
              const isToday = d.ymd === todayYmd;
              const isSelected = d.ymd === selectedDay;
              return (
                <button
                  key={d.ymd}
                  type="button"
                  onClick={() => onSelectDay(d.ymd)}
                  className="flex flex-col items-center justify-center gap-1 bg-transparent"
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium uppercase tracking-wide",
                      isToday ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {WEEKDAY_SHORT[(d.date.getDay() + 6) % 7]}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full text-base",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : isToday
                          ? "text-primary font-semibold"
                          : "text-foreground",
                    )}
                  >
                    {d.date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* All-day strip — chips only, no label cell */}
          {maxAllDay > 0 && (
            <div
              className="grid pb-2"
              style={{ gridTemplateColumns: gridTemplate, height: allDayBlockHeight }}
            >
              <div />
              {days.map((d) => {
                const items = (allDayByDay.get(d.ymd) || []).slice(0, maxAllDay);
                return (
                  <div
                    key={d.ymd}
                    className="px-1 flex flex-col gap-0.5"
                  >
                    {items.map((b) => (
                      <button
                        key={`${b.kind}-${b.id}`}
                        type="button"
                        onClick={(e) => handleBlockClick(e, b, d.ymd)}
                        title={b.title}
                        className={cn(
                          "h-[20px] px-1.5 rounded-md text-[10px] leading-[20px] font-medium truncate text-left border-transparent",
                          b.colorClass,
                        )}
                      >
                        {b.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Time grid — independent rounded cards per (day, hour) */}
          <div
            className="grid relative"
            style={{ gridTemplateColumns: gridTemplate, height: totalHeight }}
          >
            {/* Time gutter labels (no background, no border) */}
            <div className="relative">
              {Array.from({ length: totalHours }).map((_, i) => (
                <div
                  key={i}
                  className="absolute right-1.5 text-[10px] font-medium text-muted-foreground"
                  style={{ top: i * HOUR_PX - 6 }}
                >
                  {((startHour + i) % 12 || 12)}{(startHour + i) < 12 ? " AM" : " PM"}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d) => {
              const items = timedByDay.get(d.ymd) || [];
              const isToday = d.ymd === todayYmd;
              return (
                <div
                  key={d.ymd}
                  className="relative"
                  onClick={() => onSelectDay(d.ymd)}
                >
                  {/* Per-hour rounded cards */}
                  {Array.from({ length: totalHours }).map((_, h) => (
                    <div
                      key={h}
                      className={cn(
                        "absolute left-1 right-1 rounded-lg border",
                        isToday
                          ? "bg-muted/20 border-border/40"
                          : "bg-muted/15 border-border/40",
                      )}
                      style={{ top: h * HOUR_PX + 3, height: HOUR_PX - 6 }}
                    />
                  ))}
                  {/* Event blocks */}
                  {items.map((b) => {
                    const top = ((b.startMin - startHour * 60) / 60) * HOUR_PX;
                    const height = Math.max(
                      18,
                      ((b.endMin - b.startMin) / 60) * HOUR_PX - 2,
                    );
                    const clampedTop = Math.max(0, top);
                    return (
                      <button
                        key={`${b.kind}-${b.id}`}
                        type="button"
                        onClick={(e) => handleBlockClick(e, b, d.ymd)}
                        title={b.title}
                        className={cn(
                          "absolute left-1.5 right-1.5 rounded-lg px-1.5 py-0.5 text-[10px] font-medium text-left overflow-hidden border border-transparent shadow-sm z-10",
                          b.colorClass,
                        )}
                        style={{ top: clampedTop, height }}
                      >
                        <div className="truncate">{b.title}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
