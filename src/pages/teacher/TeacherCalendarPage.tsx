import { useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
import { calendarEvents, ccaActivities } from "@/data/mockData";
import { format, isSameDay, parseISO } from "date-fns";
import { TagCategory } from "@/types/calendarTags";
import {
  filterEventsByRole,
  filterEventsByCategory,
  getTagColor,
  getTagDisplayName,
  getCategoryDisplayName,
  getCategoryColor,
} from "@/lib/calendarUtils";

export default function TeacherCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<TagCategory | "all">("all");

  // Filter events for teacher role
  const visibleEvents = filterEventsByRole(calendarEvents, "teacher");
  const filteredEvents = filterEventsByCategory(visibleEvents, categoryFilter);

  const eventsOnSelectedDate = filteredEvents.filter(event => 
    isSameDay(parseISO(event.date), selectedDate)
  );

  const getCcaCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "sports": return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
      case "arts": return "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300";
      case "academic": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const eventDates = filteredEvents.map(e => parseISO(e.date));

  // Categories visible to teachers (all except admin-only)
  const teacherVisibleCategories: (TagCategory | "all")[] = [
    "all",
    "school-level",
    "exams",
    "holidays",
    "events",
    "staff-admin",
    "due-dates",
    "students",
    "parents",
  ];

  return (
    <TeacherAppLayout>
      <AppHeader 
        showBack
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
          </div>
        }
      />

      <div className="px-4 mt-4">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="cca">CCA Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {teacherVisibleCategories.map((cat) => (
                <Badge
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  className={`cursor-pointer whitespace-nowrap ${
                    categoryFilter === cat ? "" : cat !== "all" ? getCategoryColor(cat as TagCategory) : ""
                  }`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === "all" ? "All" : getCategoryDisplayName(cat as TagCategory)}
                </Badge>
              ))}
            </div>

            <Card>
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md"
                  modifiers={{
                    hasEvent: eventDates
                  }}
                  modifiersStyles={{
                    hasEvent: {
                      fontWeight: "bold",
                      textDecoration: "underline",
                      textDecorationColor: "hsl(var(--primary))"
                    }
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Events on {format(selectedDate, "MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventsOnSelectedDate.length > 0 ? (
                  eventsOnSelectedDate.map((event) => (
                    <div 
                      key={event.id}
                      className="p-3 rounded-lg bg-accent/50 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-foreground">{event.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {event.tags.map((tag) => (
                          <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                            {getTagDisplayName(tag)}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  <p className="text-center text-muted-foreground py-4">
                    No events scheduled for this date
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cca" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">CCA Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ccaActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="p-3 rounded-lg bg-accent/50 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-foreground">{activity.name}</h3>
                      <Badge className={getCcaCategoryColor(activity.category)}>
                        {activity.category}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span><strong>Day:</strong> {activity.day}</span>
                      <span><strong>Time:</strong> {activity.time}</span>
                      <span><strong>Venue:</strong> {activity.venue}</span>
                      <span><strong>Coach:</strong> {activity.coach}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TeacherAppLayout>
  );
}