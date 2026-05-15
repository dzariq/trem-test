import { useState, useMemo, type KeyboardEvent, type MouseEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Clock, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import type { UpcomingEvent } from "@/data/calendar";
import type { UpcomingCcaSession } from "@/hooks/useUpcomingCcaSessions";
import { EventDetailsSheet } from "@/components/events/EventDetailsSheet";
import {
  PARENT_CATEGORY_ORDER,
  TEACHER_CATEGORY_ORDER,
  CATEGORY_PILL_STYLES,
  mapDbToCategory,
} from "@/lib/calendarCategorySubtypes";
import { CATEGORY_DISPLAY_NAMES, type TagCategory } from "@/types/calendarTags";
import { cn } from "@/lib/utils";

type EventCategory = "all" | TagCategory;

type MergedEvent = (UpcomingEvent | UpcomingCcaSession) & { isCca?: boolean };

interface UpcomingEventsProps {
  events?: UpcomingEvent[];
  ccaSessions?: UpcomingCcaSession[];
  seeAllPath?: string;
}

export function UpcomingEvents({ events, ccaSessions, seeAllPath = "/parent/calendar" }: UpcomingEventsProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<EventCategory>("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MergedEvent | null>(null);

  const isTeacher = seeAllPath.includes("/teacher");
  const categoryOrder: TagCategory[] = isTeacher ? TEACHER_CATEGORY_ORDER : PARENT_CATEGORY_ORDER;

  // Merge calendar events and CCA sessions, sorted by date
  const mergedEvents = useMemo<MergedEvent[]>(() => {
    const calendarEvents: MergedEvent[] = (events ?? []).map(e => ({ ...e, isCca: false }));
    const ccaEvents: MergedEvent[] = (ccaSessions ?? []).map(s => ({ ...s, isCca: true }));
    
    const all = [...calendarEvents, ...ccaEvents];
    
    // Sort by date
    return all.sort((a, b) => {
      const dateA = (a as UpcomingCcaSession).sessionDate || (a as UpcomingEvent).startDay || "";
      const dateB = (b as UpcomingCcaSession).sessionDate || (b as UpcomingEvent).startDay || "";
      return dateA.localeCompare(dateB);
    });
  }, [events, ccaSessions]);

  const formatDateParts = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return {
      day: date.getUTCDate(),
      month: date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      full: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    };
  };

  const formatTimeRange = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return "All Day";
    const formatTime = (t: string) => {
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };
    if (endTime) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }
    return formatTime(startTime);
  };

  const getCcaCategoryColor = (category?: string) => {
    switch ((category ?? "").toLowerCase()) {
      case "sports": return "bg-orange-500 text-white";
      case "arts": return "bg-pink-500 text-white";
      case "academic": return "bg-indigo-500 text-white";
      default: return "bg-primary text-primary-foreground";
    }
  };

  const filters: { value: EventCategory; label: string; pillStyle?: string }[] = [
    { value: "all", label: "All" },
    ...categoryOrder.map((c) => ({
      value: c,
      label: CATEGORY_DISPLAY_NAMES[c],
      pillStyle: CATEGORY_PILL_STYLES[c],
    })),
  ];

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return mergedEvents;

    return mergedEvents.filter((e) => {
      if (e.isCca) return false; // CCA sessions only shown under "All"
      const calEvent = e as UpcomingEvent;
      const mapped = mapDbToCategory(calEvent.category || "", (calEvent as any).eventType);
      return mapped === activeFilter;
    });
  }, [mergedEvents, activeFilter]);

  const openDetails = (event: MergedEvent, triggerEl?: HTMLElement | null) => {
    triggerEl?.blur?.();
    setSelectedEvent(event);
    setDetailsOpen(true);
  };

  const handleCardClick = (
    mouseEvent: MouseEvent<HTMLElement>,
    event: MergedEvent | null
  ) => {
    if (!event) return;
    openDetails(event, mouseEvent.currentTarget);
  };

  const handleKeyDown = (keyboardEvent: KeyboardEvent, item: MergedEvent) => {
    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
      keyboardEvent.preventDefault();
      openDetails(item, keyboardEvent.currentTarget as HTMLElement | null);
    }
  };

  return (
    <section className="px-4 py-4 overflow-x-hidden">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-lg font-semibold text-foreground">What's Coming Up</h2>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Filter"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <div className="flex flex-wrap gap-1.5">
                {filters.map((filter) => (
                  <Badge
                    key={filter.value}
                    variant="outline"
                    className={cn(
                      "cursor-pointer w-fit shrink-0 px-compact py-1 border transition-colors",
                      filter.pillStyle,
                      activeFilter === filter.value
                        ? "ring-2 ring-primary/40"
                        : "opacity-60"
                    )}
                    onClick={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                  </Badge>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="link"
            className="text-primary p-0 h-auto text-sm"
            onClick={() => navigate(seeAllPath)}
          >
            See all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {filteredEvents.slice(0, 5).map((event) => {
          const isCca = event.isCca;
          
          if (isCca) {
            const ccaSession = event as UpcomingCcaSession;
            const { day, month, full } = formatDateParts(ccaSession.sessionDate);
            const timeLabel = formatTimeRange(ccaSession.startTime, ccaSession.endTime);
            const locationLabel = ccaSession.locationName || "—";

            return (
              <Card
                key={`cca-${ccaSession.id}`}
                className="bg-card border-border shadow-sm border-l-4 border-l-primary/50 cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={(e) => handleCardClick(e, ccaSession)}
                onKeyDown={(e) => handleKeyDown(e, ccaSession)}
              >
                <CardContent className="p-3 flex items-center gap-4">
                  <div className={`flex flex-col items-center justify-center rounded-lg w-14 h-14 flex-shrink-0 ${getCcaCategoryColor(ccaSession.category)}`}>
                    <span className="text-lg font-bold leading-none">{day}</span>
                    <span className="text-xs uppercase">{month}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-foreground truncate">
                        {ccaSession.customTitle || ccaSession.activityName}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary shrink-0">
                        CCA
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeLabel}
                      </span>
                      <span className="text-xs">{full}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {locationLabel}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // Regular calendar event
          const calEvent = event as UpcomingEvent;
          const startDate = calEvent.startDay || calEvent.date;
          const allDay = calEvent.allDay ?? true;
          const timeLabel = allDay ? "All Day" : calEvent.time || "—";
          const locationLabel = calEvent.location || "—";
          const { day, month, full } = formatDateParts(startDate);
          
          return (
            <Card
              key={calEvent.id}
              className="bg-card border-border shadow-sm cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={(e) => handleCardClick(e, calEvent)}
              onKeyDown={(e) => handleKeyDown(e, calEvent)}
            >
              <CardContent className="p-3 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg w-14 h-14 flex-shrink-0">
                  <span className="text-lg font-bold leading-none">{day}</span>
                  <span className="text-xs uppercase">{month}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h3 className="font-medium text-foreground truncate flex-1 min-w-0">{calEvent.title}</h3>
                    {(() => {
                      const cat = mapDbToCategory(calEvent.category || "", (calEvent as any).eventType);
                      if (!cat) return null;
                      return (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 shrink-0 border",
                            CATEGORY_PILL_STYLES[cat]
                          )}
                        >
                          {CATEGORY_DISPLAY_NAMES[cat]}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeLabel}
                    </span>
                    <span className="text-xs">{full}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {locationLabel}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredEvents.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No events in this category
          </p>
        )}
      </div>
      
      {/* Helper text */}
      {(ccaSessions?.length ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          CCA sessions shown based on your assigned activities
        </p>
      )}

      <EventDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        event={selectedEvent}
      />
    </section>
  );
}
