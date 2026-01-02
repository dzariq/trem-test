import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { calendarEvents, ccaActivities, students } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { MapPin, Clock, User, ChevronDown, Users, CalendarDays, ClipboardList } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagCategory, CalendarTag, PARENT_HIDDEN_TAGS } from "@/types/calendarTags";
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

type CCAActivity = typeof ccaActivities[0];

export default function CalendarPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "calendar";
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<TagCategory | "all">("all");
  const [selectedTag, setSelectedTag] = useState<CalendarTag | null>(null);
  const [ccaCategoryFilter, setCcaCategoryFilter] = useState("all");
  const [selectedCCA, setSelectedCCA] = useState<CCAActivity | null>(null);

  // Filter events for parent role
  const visibleEvents = filterEventsByRole(calendarEvents, "parent");
  let filteredEvents = filterEventsByCategory(visibleEvents, categoryFilter);
  
  // Apply tag filter if a specific tag is selected
  if (selectedTag) {
    filteredEvents = filterEventsByTag(filteredEvents, selectedTag);
  }

  // Get CCA category color
  const getCcaCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "sports": return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
      case "arts": return "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300";
      case "academic": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Get events for selected date
  const selectedDateStr = selectedDate?.toISOString().split('T')[0];
  const eventsForSelectedDate = filteredEvents.filter(
    event => event.date === selectedDateStr
  );

  // Get dates with events for calendar highlighting
  const datesWithEvents = filteredEvents.map(e => new Date(e.date));

  // Filter CCA activities
  const filteredCCA = ccaCategoryFilter === "all" 
    ? ccaActivities 
    : ccaActivities.filter(a => a.category.toLowerCase() === ccaCategoryFilter.toLowerCase());

  // Categories visible to parents (exclude staff-admin and due-dates)
  const parentVisibleCategories: (TagCategory | "all")[] = [
    "all",
    "school-level",
    "exams",
    "holidays",
    "events",
    "students",
    "parents",
  ];

  // Get visible tags for a category (filter out hidden tags for parents)
  const getVisibleTagsForCategory = (category: TagCategory): CalendarTag[] => {
    return getTagsByCategory(category).filter(tag => !PARENT_HIDDEN_TAGS.includes(tag));
  };

  const handleCategoryClick = (cat: TagCategory | "all") => {
    setCategoryFilter(cat);
    setSelectedTag(null);
  };

  const handleTagSelect = (tag: CalendarTag) => {
    setSelectedTag(tag);
  };

  return (
    <AppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-8 w-8 object-contain" />
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
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="calendar">Main Calendar</TabsTrigger>
            <TabsTrigger value="cca">CCA Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4 space-y-4">
            {/* Category Filter with Dropdowns */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {parentVisibleCategories.map((cat) => {
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

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => setSelectedCCA(activity)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* CCA Details Dialog */}
      <Dialog open={!!selectedCCA} onOpenChange={(open) => !open && setSelectedCCA(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedCCA && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl">{selectedCCA.name}</DialogTitle>
                  <Badge className={getCcaCategoryColor(selectedCCA.category)} variant="secondary">
                    {selectedCCA.category}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Description */}
                <p className="text-sm text-muted-foreground">{selectedCCA.description}</p>

                {/* Schedule Info */}
                <Card className="bg-muted/30 border-0">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Schedule</p>
                        <p className="text-sm font-medium">{selectedCCA.day}, {selectedCCA.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Venue</p>
                        <p className="text-sm font-medium">{selectedCCA.venue}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Coach</p>
                        <p className="text-sm font-medium">{selectedCCA.coach}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enrollment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Enrollment</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedCCA.currentEnrollment} / {selectedCCA.maxCapacity} students
                    </span>
                  </div>
                  <Progress 
                    value={(selectedCCA.currentEnrollment / selectedCCA.maxCapacity) * 100} 
                    className="h-2"
                  />
                  {selectedCCA.currentEnrollment >= selectedCCA.maxCapacity && (
                    <p className="text-xs text-destructive">This activity is at full capacity</p>
                  )}
                </div>

                {/* Requirements */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Requirements</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{selectedCCA.requirements}</p>
                </div>

                {/* Next Session */}
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-primary/80">Next Session</p>
                  <p className="text-sm font-medium text-primary">
                    {format(parseISO(selectedCCA.upcomingSession), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}