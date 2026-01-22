import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import type { UpcomingEvent } from "@/data/calendar";
import type { UpcomingCcaSession } from "@/hooks/useUpcomingCcaSessions";

type EventCategory = "all" | "academic" | "sports" | "arts" | "meeting" | "cca";

type MergedEvent = (UpcomingEvent | UpcomingCcaSession) & { isCca?: boolean };

interface UpcomingEventsProps {
  events?: UpcomingEvent[];
  ccaSessions?: UpcomingCcaSession[];
  seeAllPath?: string;
}

export function UpcomingEvents({ events, ccaSessions, seeAllPath = "/parent/calendar" }: UpcomingEventsProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<EventCategory>("all");

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

  const filters: { value: EventCategory; label: string }[] = [
    { value: "all", label: "All" },
    { value: "cca", label: "CCA" },
    { value: "academic", label: "Academic" },
    { value: "sports", label: "Sports" },
    { value: "arts", label: "Arts" },
    { value: "meeting", label: "Meeting" },
  ];

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return mergedEvents;
    if (activeFilter === "cca") return mergedEvents.filter(e => e.isCca);
    
    return mergedEvents.filter(e => {
      if (e.isCca) {
        const ccaSession = e as UpcomingCcaSession;
        return ccaSession.category?.toLowerCase() === activeFilter;
      }
      const calEvent = e as UpcomingEvent;
      return calEvent.category?.toLowerCase() === activeFilter;
    });
  }, [mergedEvents, activeFilter]);

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
        <Button 
          variant="link" 
          className="text-primary p-0 h-auto text-sm"
          onClick={() => navigate(seeAllPath)}
        >
          See all <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <Badge
            key={filter.value}
            variant={activeFilter === filter.value ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-3 py-1"
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </Badge>
        ))}
      </div>
      
      <div className="space-y-3">
        {filteredEvents.slice(0, 5).map((event) => {
          const isCca = event.isCca;
          
          if (isCca) {
            const ccaSession = event as UpcomingCcaSession;
            const { day, month, full } = formatDateParts(ccaSession.sessionDate);
            const timeLabel = formatTimeRange(ccaSession.startTime, ccaSession.endTime);
            
            return (
              <Card key={`cca-${ccaSession.id}`} className="bg-card border-border shadow-sm border-l-4 border-l-primary/50">
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
                    {ccaSession.locationName && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {ccaSession.locationName}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // Regular calendar event
          const calEvent = event as UpcomingEvent;
          const startDate = calEvent.startDay ?? (calEvent as any).date;
          const allDay = calEvent.allDay ?? true;
          const timeLabel = allDay ? "All Day" : calEvent.time;
          const { day, month, full } = formatDateParts(startDate);
          
          return (
            <Card key={calEvent.id} className="bg-card border-border shadow-sm">
              <CardContent className="p-3 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg w-14 h-14 flex-shrink-0">
                  <span className="text-lg font-bold leading-none">{day}</span>
                  <span className="text-xs uppercase">{month}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{calEvent.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeLabel}
                    </span>
                    <span className="text-xs">{full}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {calEvent.location}
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
    </section>
  );
}
