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

export default function TeacherCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const eventsOnSelectedDate = calendarEvents.filter(event => 
    isSameDay(parseISO(event.date), selectedDate)
  );

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      Event: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      Meeting: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Exam: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      Holiday: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return colors[tag] || "bg-muted text-muted-foreground";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Sports: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      Arts: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      Academic: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const eventDates = calendarEvents.map(e => parseISO(e.date));

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
                        <Badge className={getTagColor(event.tag)}>{event.tag}</Badge>
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
                      <Badge className={getCategoryColor(activity.category)}>
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
