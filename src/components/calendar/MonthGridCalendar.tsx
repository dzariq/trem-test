import { useMemo, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getEventBadgeColor } from "@/lib/calendarUtils";
import { getCcaTypeColor } from "@/components/cca/CcaTypeTabs";
import type { UpcomingEvent } from "@/data/calendar";
import type { CcaCalendarSession } from "@/hooks/useCcaSessionsCalendar";

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
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
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
  maxChipsPerDay = 4,
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

  // Build grid days (always 6 weeks, leading/trailing from adjacent months)
  const days = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstOfMonth = new Date(year, m, 1);
    const startOffset = firstOfMonth.getDay(); // 0=Sun
    const gridStart = new Date(year, m, 1 - startOffset);
    const cells: Array<{ date: Date; ymd: string; inMonth: boolean }> = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push({ date: d, ymd: toYmd(d), inMonth: d.getMonth() === m });
    }
    // Trim trailing weeks that are entirely outside the month
    const weeks: typeof cells[] = [];
    for (let i = 0; i < 6; i++) weeks.push(cells.slice(i * 7, i * 7 + 7));
    while (weeks.length > 4 && weeks[weeks.length - 1].every((c) => !c.inMonth)) {
      weeks.pop();
    }
    return weeks.flat();
  }, [month]);

  const goPrev = () => {
    const d = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    onMonthChange(d);
  };
  const goNext = () => {
    const d = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    onMonthChange(d);
  };

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden">
      <CardContent className="p-2 sm:p-3">
        {/* Header */}
        <div className="flex items-center justify-between px-1 py-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md"
            onClick={goPrev}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-base font-semibold text-foreground">
            {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-md"
            onClick={goNext}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 mt-2 mb-1">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-center text-[11px] font-medium text-muted-foreground py-1"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map(({ date, ymd, inMonth }) => {
            const bucket = buckets.get(ymd) || [];
            const isToday = ymd === todayYmd;
            const isSelected = ymd === selectedDay;
            const overflowing = bucket.length > maxChipsPerDay;
            const visibleCount = overflowing ? maxChipsPerDay - 1 : Math.min(bucket.length, maxChipsPerDay);
            const visible = bucket.slice(0, visibleCount);
            const extra = bucket.length - visibleCount;

            const handleCellClick = () => {
              if (!inMonth) {
                onMonthChange(new Date(date.getFullYear(), date.getMonth(), 1));
              }
              onSelectDay(ymd);
            };

            const handleChipClick = (e: MouseEvent, item: ChipItem) => {
              e.stopPropagation();
              onSelectDay(ymd);
              if (item.kind === "event") onEventClick?.(item.payload);
              else onSessionClick?.(item.payload);
            };

            return (
              <button
                key={ymd}
                type="button"
                onClick={handleCellClick}
                className={cn(
                  "flex flex-col items-stretch text-left rounded-md border transition-colors min-h-[88px] sm:min-h-[110px] p-1 overflow-hidden",
                  inMonth ? "bg-background border-border/60" : "bg-muted/20 border-transparent",
                  isSelected && "ring-2 ring-primary border-primary",
                  !isSelected && "hover:bg-muted/40",
                )}
              >
                <div className="flex items-center justify-between mb-1">
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
                        "h-4 px-1 rounded-sm text-[9px] sm:text-[10px] leading-4 font-medium truncate border-transparent",
                        item.colorClass,
                      )}
                    >
                      {item.title}
                    </div>
                  ))}
                  {overflowing && extra > 0 && (
                    <div className="h-4 px-1 rounded-sm text-[9px] sm:text-[10px] leading-4 font-medium text-muted-foreground bg-muted/60 truncate">
                      +{extra} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
