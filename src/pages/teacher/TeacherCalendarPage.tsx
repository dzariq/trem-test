import { useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, ChevronDown } from "lucide-react";
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

      <div className="px-4 mt-4">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="cca">CCA Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
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