import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { calendarEvents, ccaActivities, students } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, User, Filter, CalendarDays } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  const eventTypes = ["all", "event", "meeting", "exam", "holiday"];

  const getEventTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "exam": return "bg-destructive text-destructive-foreground";
      case "holiday": return "bg-chart-4 text-card";
      case "event": return "bg-chart-1 text-card";
      case "meeting": return "bg-chart-3 text-card";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "sports": return "bg-chart-1 text-card";
      case "arts": return "bg-chart-2 text-card";
      case "academic": return "bg-chart-3 text-card";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Get events for selected date
  const selectedDateStr = selectedDate?.toISOString().split('T')[0];
  const eventsForSelectedDate = calendarEvents.filter(
    event => event.date === selectedDateStr
  );

  // Get dates with events for calendar highlighting
  const datesWithEvents = calendarEvents.map(e => new Date(e.date));

  // Filter CCA activities
  const filteredCCA = categoryFilter === "all" 
    ? ccaActivities 
    : ccaActivities.filter(a => a.category.toLowerCase() === categoryFilter.toLowerCase());

  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
          </div>
        }
        rightContent={
          <Select defaultValue={students[0]?.id}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Student" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name.split(' ')[0]} {student.name.split(' ')[1]?.[0]}.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <section className="px-4 pt-4">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="calendar">Main Calendar</TabsTrigger>
            <TabsTrigger value="cca">CCA Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4 space-y-4">
            {/* Calendar Component */}
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md w-full pointer-events-auto"
                  modifiers={{
                    hasEvent: datesWithEvents
                  }}
                  modifiersStyles={{
                    hasEvent: { 
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                      fontWeight: "bold"
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Events for Selected Date */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  {selectedDate?.toLocaleDateString("en-US", { 
                    weekday: "long", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventsForSelectedDate.length > 0 ? (
                  eventsForSelectedDate.map((event) => (
                    <div 
                      key={event.id}
                      className="p-3 rounded-lg bg-accent/50 border border-border/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                        <Badge className={getEventTagColor(event.tag)}>
                          {event.tag}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No events scheduled for this day</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events List */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Event Type Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {eventTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={eventTypeFilter === type ? "default" : "outline"}
                      className="cursor-pointer whitespace-nowrap capitalize"
                      onClick={() => setEventTypeFilter(type)}
                    >
                      {type === "all" ? "All" : type}
                    </Badge>
                  ))}
                </div>

                {calendarEvents
                  .filter(e => eventTypeFilter === "all" || e.tag.toLowerCase() === eventTypeFilter)
                  .slice(0, 5)
                  .map((event) => {
                    const eventDate = new Date(event.date);
                    return (
                      <div 
                        key={event.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg w-12 h-12 flex-shrink-0">
                          <span className="text-sm font-bold leading-none">{eventDate.getDate()}</span>
                          <span className="text-xs uppercase">{eventDate.toLocaleDateString("en-US", { month: "short" })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.time}</p>
                        </div>
                        <Badge className={getEventTagColor(event.tag)}>
                          {event.tag}
                        </Badge>
                      </div>
                    );
                  })}

                {calendarEvents.filter(e => eventTypeFilter === "all" || e.tag.toLowerCase() === eventTypeFilter).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No events found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cca" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Badge 
                variant={categoryFilter === "all" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCategoryFilter("all")}
              >
                All
              </Badge>
              <Badge 
                variant={categoryFilter === "sports" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCategoryFilter("sports")}
              >
                Sports
              </Badge>
              <Badge 
                variant={categoryFilter === "arts" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCategoryFilter("arts")}
              >
                Arts
              </Badge>
              <Badge 
                variant={categoryFilter === "academic" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCategoryFilter("academic")}
              >
                Academic
              </Badge>
            </div>

            {/* CCA List */}
            <div className="space-y-3">
              {filteredCCA.map((activity) => (
                <Card key={activity.id} className="bg-card border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{activity.name}</h3>
                        <Badge className={getCategoryColor(activity.category)} variant="secondary">
                          {activity.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{activity.day}, {activity.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{activity.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{activity.coach}</span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full mt-4">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </AppLayout>
  );
}
