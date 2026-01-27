import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { UpcomingEvent } from "@/data/calendar";
import type { UpcomingCcaSession } from "@/hooks/useUpcomingCcaSessions";
import { getTagColor, getTagDisplayName } from "@/lib/calendarUtils";

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
  const dateKey = cca ? event.sessionDate : event.startDay || event.date;
  const dateLabel = formatDateLabel(dateKey);
  const timeLabel = cca ? formatTimeRange(event.startTime, event.endTime) : event.allDay ? "All Day" : event.time;
  const locationLabel = cca ? event.locationName || "School" : event.location || "School";
  const description = cca ? event.description : event.description;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <div className="flex flex-wrap items-center gap-2">
            <DrawerTitle className="text-xl">{cca ? event.customTitle || event.activityName : event.title}</DrawerTitle>
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
          <DrawerDescription className="text-sm">
            Event details
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-[calc(1.25rem+var(--safe-bottom))] space-y-4">
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

          {!cca && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <Badge key={tag} className={`text-xs shrink-0 w-fit ${getTagColor(tag)}`}>
                  {getTagDisplayName(tag)}
                </Badge>
              ))}
            </div>
          )}

          {description && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {description}
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
