import { useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, User, ChevronDown } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
import { calendarEvents, ccaActivities } from "@/data/mockData";
import { format, isSameDay, parseISO } from "date-fns";
import { TagCategory, CalendarTag, TEACHER_HIDDEN_TAGS } from "@/types/calendarTags";
import {
  filterEventsByRole,
  filterEventsByCategory,
  filterEventsByTag,
  getTagColor,
  getTagDisplayName,
  getCategoryDisplayName,
  getCategoryColor,
  getTagsByCategory,
} from "@/lib/calendarUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TeacherCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<TagCategory | "all">("all");
  const [selectedTag, setSelectedTag] = useState<CalendarTag | null>(null);
  const [ccaCategoryFilter, setCcaCategoryFilter] = useState("all");

  // Filter events for teacher role
  const visibleEvents = filterEventsByRole(calendarEvents, "teacher");
  let filteredEvents = filterEventsByCategory(visibleEvents, categoryFilter);
  
  // Apply tag filter if a specific tag is selected
  if (selectedTag) {
    filteredEvents = filterEventsByTag(filteredEvents, selectedTag);
  }

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

  // Filter CCA activities
  const filteredCCA = ccaCategoryFilter === "all" 
    ? ccaActivities 
    : ccaActivities.filter(a => a.category.toLowerCase() === ccaCategoryFilter.toLowerCase());

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

  // Get visible tags for a category (filter out hidden tags for teachers)
  const getVisibleTagsForCategory = (category: TagCategory): CalendarTag[] => {
    return getTagsByCategory(category).filter(tag => !TEACHER_HIDDEN_TAGS.includes(tag));
  };

  const handleCategoryClick = (cat: TagCategory | "all") => {
    setCategoryFilter(cat);
    setSelectedTag(null);
  };

  const handleTagSelect = (tag: CalendarTag) => {
    setSelectedTag(tag);
  };

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

      <section className="px-4 pt-4">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="cca">CCA Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4 space-y-4">
            {/* Category Filter with Dropdowns */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {teacherVisibleCategories.map((cat) => {
                const isSelected = categoryFilter === cat;
                const visibleTags = cat !== "all" ? getVisibleTagsForCategory(cat as TagCategory) : [];
                const hasSubTags = visibleTags.length > 0;

                if (cat === "all" || !hasSubTags) {
                  return (
                    <Badge
                      key={cat}
                      variant={isSelected && !selectedTag ? "default" : "outline"}
                      className={`cursor-pointer whitespace-nowrap ${
                        isSelected && !selectedTag ? "" : cat !== "all" ? getCategoryColor(cat as TagCategory) : ""
                      }`}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      {cat === "all" ? "All" : getCategoryDisplayName(cat as TagCategory)}
                    </Badge>
                  );
                }

                return (
                  <DropdownMenu key={cat}>
                    <DropdownMenuTrigger asChild>
                      <Badge
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                          isSelected ? "" : getCategoryColor(cat as TagCategory)
                        }`}
                      >
                        {selectedTag && categoryFilter === cat 
                          ? getTagDisplayName(selectedTag)
                          : getCategoryDisplayName(cat as TagCategory)
                        }
                        <ChevronDown className="h-3 w-3" />
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card z-50" align="start">
                      <DropdownMenuItem 
                        onClick={() => handleCategoryClick(cat)}
                        className="cursor-pointer"
                      >
                        All {getCategoryDisplayName(cat as TagCategory)}
                      </DropdownMenuItem>
                      {visibleTags.map((tag) => (
                        <DropdownMenuItem 
                          key={tag}
                          onClick={() => {
                            setCategoryFilter(cat);
                            handleTagSelect(tag);
                          }}
                          className="cursor-pointer"
                        >
                          <Badge className={`text-xs mr-2 ${getTagColor(tag)}`}>
                            {getTagDisplayName(tag)}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>

            {/* Calendar Component */}
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md w-full pointer-events-auto"
                  modifiers={{
                    hasEvent: eventDates
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
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventsOnSelectedDate.length > 0 ? (
                  eventsOnSelectedDate.map((event) => (
                    <div 
                      key={event.id}
                      className="p-3 rounded-lg bg-accent/50 border border-border/50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {event.tags.map((tag) => (
                          <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                            {getTagDisplayName(tag)}
                          </Badge>
                        ))}
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
                    <p>No events scheduled for this date</p>
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
                {filteredEvents
                  .slice(0, 5)
                  .map((event) => {
                    const eventDate = new Date(event.date);
                    return (
                      <div 
                        key={event.id}
                        className="flex items-start gap-4 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg w-12 h-12 flex-shrink-0">
                          <span className="text-sm font-bold leading-none">{eventDate.getDate()}</span>
                          <span className="text-xs uppercase">{eventDate.toLocaleDateString("en-US", { month: "short" })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                          <p className="text-sm text-muted-foreground mb-1">{event.time}</p>
                          <div className="flex flex-wrap gap-1">
                            {event.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                                {getTagDisplayName(tag)}
                              </Badge>
                            ))}
                            {event.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{event.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {filteredEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No events found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cca" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Badge 
                variant={ccaCategoryFilter === "all" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCcaCategoryFilter("all")}
              >
                All
              </Badge>
              <Badge 
                variant={ccaCategoryFilter === "sports" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCcaCategoryFilter("sports")}
              >
                Sports
              </Badge>
              <Badge 
                variant={ccaCategoryFilter === "arts" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCcaCategoryFilter("arts")}
              >
                Arts
              </Badge>
              <Badge 
                variant={ccaCategoryFilter === "academic" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setCcaCategoryFilter("academic")}
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
                        <Badge className={getCcaCategoryColor(activity.category)} variant="secondary">
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
    </TeacherAppLayout>
  );
}