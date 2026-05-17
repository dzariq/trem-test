import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, ClipboardList, Users } from "lucide-react";
import type { UpcomingEvent } from "@/data/calendar";
import type { UpcomingCcaSession } from "@/hooks/useUpcomingCcaSessions";
import type { CcaCalendarSession } from "@/hooks/useCcaSessionsCalendar";
import { getEventBadgeColor, getEventBadgeLabel } from "@/lib/calendarUtils";
import { getCcaBucket, getCcaTypePillColor, getCcaBucketIcon } from "@/components/cca/CcaTypeTabs";
import { formatClassDisplay } from "@/lib/utils";
import { cn } from "@/lib/utils";

type CcaLike = UpcomingCcaSession | CcaCalendarSession;
type EventLike = UpcomingEvent | CcaLike;

interface EventDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventLike | null;
}

const isCcaSession = (event: EventLike): event is CcaLike => {
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
  const locationLabel = cca ? event.locationName : event.location;
  const description = (event.description || "").trim();
  const requirements = cca
    ? ((event as CcaCalendarSession).requirements || "").trim()
    : "";
  const classesInvolved: string[] = cca
    ? ((event as CcaCalendarSession).classesInvolved || []).filter(Boolean)
    : [];
  const showActivitySubtitle =
    cca && !!event.customTitle && event.customTitle !== event.activityName;

  // CCA bucket-aware label/icon/color
  const bucketKey = cca ? (event.kind || event.category) : null;
  const bucket = cca ? getCcaBucket(bucketKey) : null;
  const BucketIcon = cca ? getCcaBucketIcon(bucket!) : null;
  const bucketPill = cca ? getCcaTypePillColor(bucketKey) : "";
  const bucketLabel =
    bucket === "clubs" ? "Club" : bucket === "outdoor" ? "Outdoor" : "Event";

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0, 0.75, 1]}
      defaultSnapPoint={0.75}
      title={
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold">
              {cca ? event.customTitle || event.activityName : event.title}
            </span>
            {cca && BucketIcon ? (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs shrink-0 w-fit gap-1 border",
                  bucketPill,
                )}
              >
                <BucketIcon className="h-3 w-3" />
                {bucketLabel}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs shrink-0 w-fit">
                {event.category}
              </Badge>
            )}
          </div>
          {showActivitySubtitle && (
            <p className="text-xs text-muted-foreground font-normal">
              Activity: {event.activityName}
            </p>
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

        {locationLabel && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium text-foreground">{locationLabel}</p>
            </div>
          </div>
        )}

        {requirements && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Requirements</p>
              <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                {requirements}
              </p>
            </div>
          </div>
        )}

        {classesInvolved.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Classes Involved</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {classesInvolved.map((c) => (
                  <Badge
                    key={c}
                    variant="secondary"
                    className="text-xs font-medium"
                  >
                    {formatClassDisplay(c)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
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

      {description && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>
      )}
    </BottomSheet>
  );
}
