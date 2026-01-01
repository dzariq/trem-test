import { upcomingEvents } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Clock } from "lucide-react";

export function UpcomingEvents() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" })
    };
  };

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
        <Button variant="link" className="text-primary p-0 h-auto text-sm">
          See all <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {upcomingEvents.slice(0, 3).map((event) => {
          const { day, month } = formatDate(event.date);
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
      </div>
    </section>
  );
}
