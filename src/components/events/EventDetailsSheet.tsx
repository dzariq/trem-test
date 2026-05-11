import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { UpcomingEvent } from "@/data/calendar";
import type { UpcomingCcaSession } from "@/hooks/useUpcomingCcaSessions";
import { getEventBadgeColor, getEventBadgeLabel } from "@/lib/calendarUtils";

type EventLike = UpcomingEvent | UpcomingCcaSession;

interface EventDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventLike | null;
}

const isCcaSession = (event: EventLike): event is UpcomingCcaSession => {
  return "sessionDate" in event;
};

const formatDateLabel = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatTimeRange = (startTime: string | null, endTime: string | null) => {
  if (!startTime) return "All Day";
  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };
  return endTime ? `${formatTime(startTime)} - ${formatTime(endTime)}` : formatTime(startTime);
};

export function EventDetailsSheet({ open, onOpenChange, event }: EventDetailsSheetProps) {
  if (!event) return null;

  const cca = isCcaSession(event);
  const startKey = cca ? event.sessionDate : event.startDay || event.date;
  const endKey = cca ? event.sessionDate : event.endDay || event.startDay || event.date;
  const hasValidStart = typeof startKey === "string" && startKey.length === 10;
  const hasValidEnd = typeof endKey === "string" && endKey.length === 10;
  const isMultiDay = hasValidStart && hasValidEnd && startKey !== endKey;
  const dateLabel = hasValidStart
    ? isMultiDay
      ? `${formatDateLabel(startKey)} – ${formatDateLabel(endKey)}`
      : formatDateLabel(startKey)
    : "-";
  const timeLabel = cca
    ? formatTimeRange(event.startTime, event.endTime)
    : event.allDay
      ? "All Day"
      : event.time || "-";
  const locationLabel = cca ? event.locationName || "-" : event.location || "-";
  const description = (cca ? event.description : event.description) || "-";

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0, 0.75, 1]}
      defaultSnapPoint={0.75}
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold">
            {cca ? event.customTitle || event.activityName : event.title}
          </span>
          {cca ? (
            <>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 w-fit">
                CCA
              </Badge>
              <Badge variant="secondary" className="text-xs shrink-0 w-fit">
                {event.category}
              </Badge>
            </>
          ) : (
            <Badge variant="secondary" className="text-xs shrink-0 w-fit">
              {event.category}
            </Badge>
          )}
        </div>
      }
      description="Event details"
      bodyClassName="px-4 py-3 space-y-4"
    >
      <div className="grid gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-medium text-foreground">{dateLabel}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Time</p>
            <p className="text-sm font-medium text-foreground">{timeLabel}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm font-medium text-foreground">{locationLabel}</p>
          </div>
        </div>
      </div>

      {!cca && (event.tags.length > 0 || event.category) && (
        <div className="flex flex-wrap gap-2">
          {(event.tags.length > 0 ? event.tags : [event.category as any]).map((tag, idx) => (
            <Badge
              key={`${tag}-${idx}`}
              className={`text-xs shrink-0 w-fit border-transparent ${getEventBadgeColor(tag, event.category, (event as any).eventType)}`}
            >
              {getEventBadgeLabel(tag, event.category)}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Description</p>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {description}
        </p>
      </div>
    </BottomSheet>
  );
}
