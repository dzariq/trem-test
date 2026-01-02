import { useState } from "react";
import { upcomingEvents } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

type EventCategory = "all" | "academic" | "sports" | "arts" | "meeting";

export function UpcomingEvents() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<EventCategory>("all");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" })
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
    ? upcomingEvents
    : upcomingEvents.filter(e => e.category === activeFilter);

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
        <Button 
          variant="link" 
          className="text-primary p-0 h-auto text-sm"
          onClick={() => navigate("/parent/calendar")}
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
          const { day, month } = formatDate(event.date);
          return (
            <Card key={event.id} className="bg-card border-border shadow-sm">
              <CardContent className="p-3 flex items-center gap-4">
                <div 
                  className="relative flex flex-col items-center justify-center text-white rounded-lg w-14 h-14 flex-shrink-0 overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
                  }}
                >
                  {/* Calendar icon pattern */}
                  <Calendar className="absolute -top-1 -left-1 h-6 w-6 opacity-[0.12]" strokeWidth={1} />
                  <Calendar className="absolute -bottom-1 -right-1 h-8 w-8 opacity-[0.15]" strokeWidth={1} />
                  <Calendar className="absolute top-1/2 right-0 -translate-y-1/2 h-5 w-5 opacity-[0.10]" strokeWidth={1} />
                  <span className="relative text-lg font-bold leading-none">{day}</span>
                  <span className="relative text-xs uppercase">{month}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </span>
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
