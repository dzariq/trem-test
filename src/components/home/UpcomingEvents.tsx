import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import type { UpcomingEvent } from "@/data/calendar";

type EventCategory = "all" | "academic" | "sports" | "arts" | "meeting";

interface UpcomingEventsProps {
  events?: UpcomingEvent[];
  seeAllPath?: string;
}

export function UpcomingEvents({ events, seeAllPath = "/parent/calendar" }: UpcomingEventsProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<EventCategory>("all");
  const resolvedEvents = useMemo(
    () => events ?? [],
    [events]
  );

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

  const filters: { value: EventCategory; label: string }[] = [
    { value: "all", label: "All" },
    { value: "academic", label: "Academic" },
    { value: "sports", label: "Sports" },
    { value: "arts", label: "Arts" },
    { value: "meeting", label: "Meeting" },
  ];

  const filteredEvents = activeFilter === "all"
    ? resolvedEvents
    : resolvedEvents.filter(e => e.category === activeFilter);

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
        {filteredEvents.slice(0, 3).map((event) => {
          const startDate = (event as UpcomingEvent).startDay ?? (event as any).date;
          const allDay = (event as UpcomingEvent).allDay ?? true;
          const timeLabel = allDay ? "All Day" : (event as UpcomingEvent).time;
          const { day, month, full } = formatDateParts(startDate);
          return (
            <Card key={event.id} className="bg-card border-border shadow-sm">
              <CardContent className="p-3 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg w-14 h-14 flex-shrink-0">
                  <span className="text-lg font-bold leading-none">{day}</span>
                  <span className="text-xs uppercase">{month}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeLabel}
                    </span>
                    <span className="text-xs">{full}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {event.location}
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
    </section>
  );
}
