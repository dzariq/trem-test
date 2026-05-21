import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEventBadgeHex, getEventChipStyle } from "@/lib/calendarUtils";
import { getCcaTypePillColor, getCcaBucketIcon } from "@/components/cca/CcaTypeTabs";
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
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
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
  | { kind: "event"; id: string; title: string; colorHex: string; startMin: number; endMin: number; payload: UpcomingEvent }
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
  endHour = 21,
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
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  // Live "now" time in minutes since midnight, refreshed every 60s
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowMin(n.getHours() * 60 + n.getMinutes());
    };
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const nowTopPx = ((nowMin - startHour * 60) / 60) * HOUR_PX;
  const nowVisible = nowMin >= startHour * 60 && nowMin <= endHour * 60;

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
      const colorHex = getEventBadgeHex(
        event.tags?.[0] != null ? String(event.tags[0]) : undefined,
        event.category,
        (event as any).eventType,
        (event as any).categoryColor,
        event.title,
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
              colorHex,
              startMin,
              endMin: Math.max(endMin, startMin + 30),
              payload: event,
            });
          } else {
            pushAllDay(key, {
              kind: "event",
              id: String(event.id),
              title: event.title || "Event",
              colorHex,
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
      const colorClass = getCcaTypePillColor(session.category);
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
    // Always show the selected date's month as a 3-letter uppercase label
    // (consistent with the Month view, and avoids "April" when the current
    // week spans Apr → May but today is in May).
    return MONTH_SHORT[date.getMonth()].toUpperCase();
  }, [days, mode, date]);

  // YMDs in the visible month that have events or CCA sessions
  const eventDayKeys = useMemo(() => {
    const set = new Set<string>();
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    events.forEach((event) => {
      if (!event.startDay) return;
      const start = parseYmd(event.startDay);
      const end = event.endDay ? parseYmd(event.endDay) : start;
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      const cursor = new Date(Math.max(start.getTime(), monthStart.getTime()));
      const last = new Date(Math.min(end.getTime(), monthEnd.getTime()));
      while (cursor <= last) {
        set.add(toYmd(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    ccaSessions.forEach((s) => {
      if (s.sessionDate) set.add(s.sessionDate);
    });
    return set;
  }, [events, ccaSessions, date]);

  // Build mini-month weeks (Mon-first), including leading/trailing days from neighboring months
  const miniMonthWeeks = useMemo(() => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const leadOffset = (first.getDay() + 6) % 7; // Mon = 0
    const gridStart = new Date(year, month, 1 - leadOffset);
    const weeks: { date: Date; ymd: string; inMonth: boolean }[][] = [];
    const cursor = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
      const row: { date: Date; ymd: string; inMonth: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(cursor);
        row.push({ date: d, ymd: toYmd(d), inMonth: d.getMonth() === month });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(row);
    }
    return weeks;
  }, [date]);

  const handleMiniDayClick = (d: Date) => {
    const ymd = toYmd(d);
    onSelectDay(ymd);
    onDateChange(d);
    setMonthPickerOpen(false);
  };

  const handleMonthStripClick = (monthIdx: number) => {
    const year = date.getFullYear();
    const day = date.getDate();
    const lastDayOfTarget = new Date(year, monthIdx + 1, 0).getDate();
    const nextDate = new Date(year, monthIdx, Math.min(day, lastDayOfTarget));
    onDateChange(nextDate);
    if (mode === "day") onSelectDay(toYmd(nextDate));
  };

  // Layout: time gutter + N day columns. Use minmax(0,1fr) so columns always
  // fit the viewport (no horizontal scroll on small phones).
  const GUTTER = mode === "week" ? 36 : 44;
  const colMinWidth = mode === "day" ? "1fr" : "minmax(0, 1fr)";
  const gridTemplate = `${GUTTER}px repeat(${days.length}, ${colMinWidth})`;

  // Cap all-day rows; remember overflow per-day to render "+N more"
  const ALL_DAY_CAP = 2;
  const maxAllDay = Math.min(
    ALL_DAY_CAP,
    days.reduce((mx, d) => Math.max(mx, (allDayByDay.get(d.ymd) || []).length), 0),
  );
  const allDayRowHeight = 30;
  const allDayBlockHeight = maxAllDay > 0 ? maxAllDay * allDayRowHeight + 6 : 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-border">
        {onBackToMonth && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-md shrink-0 [touch-action:manipulation]"
              onClick={onBackToMonth}
              aria-label="Back to month view"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
        )}
        <button
            type="button"
            onClick={() => setMonthPickerOpen((v) => !v)}
            className="inline-flex items-center text-2xl sm:text-3xl font-semibold text-foreground truncate hover:opacity-80 transition-opacity min-w-0"
            aria-expanded={monthPickerOpen}
            aria-label="Toggle month picker"
          >
            <span className="truncate">{headerLabel}</span>
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {onViewChange && (
            <CalendarViewDropdown view={view ?? (mode as CalendarViewMode)} onChange={onViewChange} />
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
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md [touch-action:manipulation]"
            onClick={goNext}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expandable month picker (Google Calendar style) */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            monthPickerOpen
              ? "max-h-[min(60dvh,420px)] opacity-100 border-b border-border overflow-y-auto"
              : "max-h-0 opacity-0",
          )}
        >
        <div className="px-3 pt-3 pb-2 bg-background">
          {/* Weekday header */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_SHORT.map((w) => (
              <div
                key={w}
                className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground text-center"
              >
                {w[0]}
              </div>
            ))}
          </div>
          {/* Mini month grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {miniMonthWeeks.flat().map((cell) => {
              const isToday = cell.ymd === todayYmd;
              const isSelected = cell.ymd === selectedDay;
              const hasEvent = eventDayKeys.has(cell.ymd);
              return (
                <button
                  key={cell.ymd}
                  type="button"
                  onClick={() => handleMiniDayClick(cell.date)}
                  className="flex flex-col items-center justify-start py-1 min-h-11 no-callout"
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold"
                        : isToday
                          ? "text-primary font-semibold"
                          : cell.inMonth
                            ? "text-foreground"
                            : "text-muted-foreground/50",
                    )}
                  >
                    {cell.date.getDate()}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 h-1 w-1 rounded-full",
                      hasEvent && cell.inMonth ? "bg-primary" : "bg-transparent",
                    )}
                  />
                </button>
              );
            })}
          </div>
          {/* Month strip */}
          <div
            className="mt-3 -mx-3 px-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [overscroll-behavior-x:contain]"
          >
            <div className="flex items-center gap-1.5 pb-1 min-w-max">
              {MONTH_SHORT.map((m, idx) => {
                const isActive = idx === date.getMonth();
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
      </div>

      {/* Calendar body — fits viewport, no horizontal scroll */}
      <div className="overflow-visible">
        <div>
          {/* Day header row — floating, no background, today inside filled circle */}
          <div
            className="grid pt-2 pb-3"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="sticky left-0 z-20 bg-card" />
            {days.map((d) => {
              const isToday = d.ymd === todayYmd;
              const isSelected = d.ymd === selectedDay;
              const dayEventCount =
                (allDayByDay.get(d.ymd)?.length || 0) + (timedByDay.get(d.ymd)?.length || 0);
              const ariaLabel = `${d.date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}${dayEventCount > 0 ? `, ${dayEventCount} event${dayEventCount === 1 ? "" : "s"}` : ", no events"}${isToday ? ", today" : ""}${isSelected ? ", selected" : ""}`;
              return (
                <button
                  key={d.ymd}
                  type="button"
                  onClick={() => onSelectDay(d.ymd)}
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  className="flex flex-col items-center justify-center gap-1 bg-transparent no-callout [touch-action:manipulation]"
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
                      "inline-flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full text-base",
                      isToday
                        ? "bg-primary text-primary-foreground font-semibold"
                        : isSelected && mode === "day"
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
              <div className="sticky left-0 z-20 bg-card" />
              {days.map((d) => {
                const allItems = allDayByDay.get(d.ymd) || [];
                const visibleCap = allItems.length > maxAllDay ? maxAllDay - 1 : maxAllDay;
                const items = allItems.slice(0, visibleCap);
                const overflow = allItems.length - items.length;
                return (
                  <div
                    key={d.ymd}
                    className="px-0.5 flex flex-col gap-0.5 min-w-0"
                  >
                    {items.map((b) => (
                      <button
                        key={`${b.kind}-${b.id}`}
                        type="button"
                        onClick={(e) => handleBlockClick(e, b, d.ymd)}
                        aria-label={b.title}
                        className={cn(
                          "h-[26px] text-[9px] font-medium truncate text-left no-callout [touch-action:manipulation]",
                          b.kind === "cca"
                            ? "flex items-center gap-1 px-1.5 rounded-full border leading-none"
                            : "px-1.5 rounded-md leading-[26px] border border-transparent",
                          b.colorClass,
                        )}
                      >
                        {b.kind === "cca" && (() => {
                          const Icon = getCcaBucketIcon((b.payload as any).category);
                          return <Icon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />;
                        })()}
                        <span className="truncate">{b.title}</span>
                      </button>
                    ))}
                    {overflow > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDay(d.ymd);
                        }}
                        aria-label={`Show ${overflow} more event${overflow === 1 ? "" : "s"} on ${d.ymd}`}
                        className="h-[20px] px-1 rounded-md text-[9px] leading-[20px] font-semibold text-muted-foreground bg-muted/70 hover:bg-muted truncate text-left no-callout [touch-action:manipulation]"
                      >
                        +{overflow} more
                      </button>
                    )}
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
            <div
              className="relative sticky left-0 z-20 bg-card"
              style={{ willChange: "transform" }}
            >
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
                >
                  {/* Background tap layer — selects the day when tapping empty space */}
                  <button
                    type="button"
                    aria-label={`Select ${d.ymd}`}
                    onClick={() => onSelectDay(d.ymd)}
                    className="absolute inset-0 z-0 bg-transparent no-callout"
                  />
                  {/* Per-hour rounded cards */}
                  {Array.from({ length: totalHours }).map((_, h) => (
                    <div
                      key={h}
                      className={cn(
                        "absolute rounded-md border pointer-events-none",
                        mode === "day" ? "left-1 right-1 rounded-lg" : "left-px right-px",
                        isToday
                          ? "bg-muted/20 border-border/40"
                          : "bg-muted/15 border-border/40",
                      )}
                      style={{
                        top: h * HOUR_PX + (mode === "day" ? 3 : 1),
                        height: HOUR_PX - (mode === "day" ? 6 : 2),
                      }}
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
                        aria-label={b.title}
                        className={cn(
                          "absolute px-1.5 py-0.5 text-[10px] font-medium text-left overflow-hidden shadow-sm z-10 no-callout",
                          b.kind === "cca"
                            ? "rounded-2xl border-2"
                            : "rounded-md border border-transparent",
                          mode === "day"
                            ? cn("left-1.5 right-1.5", b.kind === "cca" ? "rounded-2xl" : "rounded-lg")
                            : "left-0.5 right-0.5",
                          b.colorClass,
                        )}
                        style={{ top: clampedTop, height }}
                      >
                        <div className="truncate flex items-center gap-1">
                          {b.kind === "cca" && (() => {
                            const Icon = getCcaBucketIcon((b.payload as any).category);
                            return <Icon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />;
                          })()}
                          <span className="truncate">{b.title}</span>
                        </div>
                      </button>
                    );
                  })}
                  {/* Now indicator — red line on today's column */}
                  {isToday && nowVisible && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: nowTopPx }}
                      aria-hidden
                    >
                      <div className="relative h-0">
                        <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500 shadow-sm" />
                        <span className="absolute left-0 right-0 top-0 border-t-2 border-red-500" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
