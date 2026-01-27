import { useEffect, useState, useMemo, type KeyboardEvent } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Clock, User, ChevronDown, CalendarDays, ClipboardList, FileText, Loader2, Settings } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";

import { format } from "date-fns";
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
import { listCalendarEvents, type UpcomingEvent } from "@/data/calendar";
import { useCcaActivities, type CcaActivity } from "@/hooks/useCcaActivities";
import { useCcaSessionsCalendar, type CcaCalendarSession } from "@/hooks/useCcaSessionsCalendar";
import { PICTeachersList } from "@/components/cca/PICTeacherPill";
import { CcaTypeTabs, getCcaTypeColor } from "@/components/cca/CcaTypeTabs";
import { ManageSessionsDialog } from "@/components/cca/ManageSessionsDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EventDetailsSheet } from "@/components/events/EventDetailsSheet";

export default function TeacherCalendarPage() {
  const { user } = useAuth();
  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDay, setSelectedDay] = useState<string>(todayYmd);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<TagCategory | "all">("all");
  const [selectedTag, setSelectedTag] = useState<CalendarTag | null>(null);
  const [ccaTypeFilter, setCcaTypeFilter] = useState("all"); // Now uses type_id or "all"
  const [selectedCCA, setSelectedCCA] = useState<CcaActivity | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<UpcomingEvent | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [manageSessionsActivity, setManageSessionsActivity] = useState<CcaActivity | null>(null);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  // Fetch CCA sessions for calendar display
  const {
    sessions: ccaSessions,
    loading: ccaSessionsLoading,
    refetch: refetchCcaSessions,
  } = useCcaSessionsCalendar({
    year: currentMonth.getFullYear(),
    month: currentMonth.getMonth() + 1,
  });

  // Fetch CCA activities from Supabase (show all for teachers, not just "my" activities)
  const {
    activities: ccaActivities,
    loading: ccaLoading,
    error: ccaError,
    filterByTypeId,
  } = useCcaActivities({
    myActivitiesOnly: false,
    currentUserId: user?.id,
    includeInactive: false,
  });

  // Helper to check if current user is PIC for an activity
  const isCurrentTeacherPIC = useMemo(() => {
    return (activity: CcaActivity): boolean => {
      if (!user?.id) return false;
      return activity.picTeachers.some(
        (t) =>
          t.teacherUserId === user.id &&
          (t.isPrimary || (t.role || "").toLowerCase() === "pic")
      );
    };
  }, [user?.id]);

  // Filter events for teacher role
  const visibleEvents = filterEventsByRole(events, "teacher");
  let filteredEvents = filterEventsByCategory(visibleEvents, categoryFilter);
  
  // Apply tag filter if a specific tag is selected
  if (selectedTag) {
    filteredEvents = filterEventsByTag(filteredEvents, selectedTag);
  }

  const toDayString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toMonthString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const parseDayKey = (dayKey: string) => {
    const [year, month, day] = dayKey.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const eventsOnSelectedDate = filteredEvents.filter(event =>
    selectedDay >= event.startDay && selectedDay <= event.endDay
  );

  // CCA sessions on selected date
  const ccaSessionsOnSelectedDate = ccaSessions.filter(
    (session) => session.sessionDate === selectedDay
  );

  // Format time display for sessions
  const formatSessionTime = (startTime: string | null, endTime: string | null) => {
    if (!startTime && !endTime) return "All Day";
    const start = startTime || "--:--";
    const end = endTime || "--:--";
    return `${start} - ${end}`;
  };

  // Use centralized color function from CcaTypeTabs
  const getCcaCategoryColor = getCcaTypeColor;

  const eventDaySet = new Set<string>();
  const addRangeDays = (startDay: string, endDay: string) => {
    const cursor = parseDayKey(startDay);
    const end = parseDayKey(endDay);
    if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) return;
    while (cursor <= end) {
      eventDaySet.add(toDayString(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  };

  filteredEvents.forEach((event) => {
    if (event.startDay && event.endDay) {
      addRangeDays(event.startDay, event.endDay);
    }
  });

  // Add CCA session dates to the calendar highlights
  ccaSessions.forEach((session) => {
    if (session.sessionDate) {
      eventDaySet.add(session.sessionDate);
    }
  });

  const visibleMonth = toMonthString(currentMonth);
  const hasEventsSet = new Set(
    Array.from(eventDaySet).filter((day) => day.startsWith(visibleMonth))
  );

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const data = await listCalendarEvents(year, month, { role: "teacher" });
        if (isMounted) {
          setEvents(data);
        }
      } catch {
        if (isMounted) {
          setEvents([]);
        }
      }
    };

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [currentMonth]);

  // Filter CCA activities by type
  const filteredCCA = filterByTypeId(ccaTypeFilter);

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

  const openEventDetails = (event: UpcomingEvent, triggerEl?: HTMLElement | null) => {
    triggerEl?.blur?.();
    setSelectedEventDetails(event);
    setEventDetailsOpen(true);
  };

  const handleEventKeyDown = (keyboardEvent: KeyboardEvent<HTMLDivElement>, event: UpcomingEvent) => {
    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
      keyboardEvent.preventDefault();
      openEventDetails(event, keyboardEvent.currentTarget);
    }
  };

  return (
    <TeacherAppLayout>
      <AppHeader 
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
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
            <div className="flex flex-wrap gap-2 pb-2">
              {teacherVisibleCategories.map((cat) => {
                const isSelected = categoryFilter === cat;
                const visibleTags = cat !== "all" ? getVisibleTagsForCategory(cat as TagCategory) : [];
                const hasSubTags = visibleTags.length > 0;

                if (cat === "all" || !hasSubTags) {
                  return (
                    <Badge
                      key={cat}
                      variant={isSelected && !selectedTag ? "default" : "outline"}
                      className={`cursor-pointer ${
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
                        className={`cursor-pointer flex items-center gap-1 ${
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
            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  onSelect={(date) => date && setSelectedDay(toDayString(date))}
                  onMonthChange={(date) => {
                    setCurrentMonth(date);
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    setSelectedDay(`${date.getFullYear()}-${month}-01`);
                  }}
                  className="rounded-md w-full pointer-events-auto"
                  modifiers={{
                    hasEvent: (date) => hasEventsSet.has(toDayString(date)),
                    selected: (date) => toDayString(date) === selectedDay,
                  }}
                  modifiersStyles={{
                    hasEvent: { 
                      backgroundColor: "hsl(var(--primary) / 0.1)",
                      fontWeight: "bold"
                    },
                    selected: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      fontWeight: "bold",
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Events for Selected Date */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  {format(parseDayKey(selectedDay), "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* CCA Sessions for this date */}
                {ccaSessionsOnSelectedDate.map((session) => (
                  <div 
                    key={session.id}
                    className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-foreground">
                        {session.customTitle || session.activityName}
                      </h3>
                      <Badge className={`text-xs ${getCcaCategoryColor(session.category)}`}>
                        CCA
                      </Badge>
                    </div>
                    {session.customTitle && (
                      <p className="text-xs text-muted-foreground mb-2">{session.activityName}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatSessionTime(session.startTime, session.endTime)}
                      </span>
                      {session.locationName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.locationName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Calendar Events for this date */}
                {eventsOnSelectedDate.map((event) => (
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
                ))}

                {eventsOnSelectedDate.length === 0 && ccaSessionsOnSelectedDate.length === 0 && (
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
                    const eventDate = new Date(`${event.startDay}T00:00:00Z`);
                    return (
                      <div 
                        key={event.id}
                        className="flex items-start gap-4 p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => openEventDetails(event, e.currentTarget)}
                        onKeyDown={(e) => handleEventKeyDown(e, event)}
                      >
                        <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg w-12 h-12 flex-shrink-0">
                          <span className="text-sm font-bold leading-none">{eventDate.getDate()}</span>
                          <span className="text-xs uppercase">{eventDate.toLocaleDateString("en-US", { month: "short" })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                          <p className="text-sm text-muted-foreground mb-1">
                            {event.allDay ? "All Day" : event.time}
                          </p>
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
            {/* Dynamic Type Tabs from Backend */}
            <CcaTypeTabs
              selectedTypeId={ccaTypeFilter}
              onSelectType={setCcaTypeFilter}
            />

            {/* CCA List */}
            <div className="space-y-3">
              {ccaLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading CCA activities...</span>
                </div>
              )}

              {ccaError && (
                <div className="text-center py-8 text-destructive">
                  <p>Failed to load CCA activities</p>
                  <p className="text-sm">{ccaError}</p>
                </div>
              )}

              {!ccaLoading && !ccaError && filteredCCA.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No CCA activities found</p>
                </div>
              )}

              {!ccaLoading && !ccaError && filteredCCA.map((activity) => {
                const isPIC = isCurrentTeacherPIC(activity);
                return (
                  <Card key={activity.id} className="bg-card border-border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{activity.name}</h3>
                          {isPIC && (
                            <Badge variant="default" className="text-xs">
                              PIC
                            </Badge>
                          )}
                        </div>
                        <Badge className={getCcaCategoryColor(activity.category)} variant="secondary">
                          {activity.category}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {(activity.meetingDay || activity.meetingTime) && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {activity.meetingDay || "TBD"}
                              {activity.meetingTime ? `, ${activity.meetingTime}` : ""}
                            </span>
                          </div>
                        )}
                        {activity.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{activity.location}</span>
                          </div>
                        )}
                        {(activity.picTeachers.length > 0 || activity.coordinatorName) && (
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5" />
                            <span>
                              {activity.picTeachers.length > 0
                                ? activity.picTeachers.map((t) => t.fullName).join(", ")
                                : activity.coordinatorName}
                            </span>
                          </div>
                        )}
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
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* CCA Details Dialog */}
      <Dialog open={!!selectedCCA} onOpenChange={(open) => !open && setSelectedCCA(null)}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          {selectedCCA && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl">{selectedCCA.name}</DialogTitle>
                  {isCurrentTeacherPIC(selectedCCA) && (
                    <Badge variant="default" className="text-xs">
                      PIC
                    </Badge>
                  )}
                  <Badge className={getCcaCategoryColor(selectedCCA.category)} variant="secondary">
                    {selectedCCA.category}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 pt-2">
                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {selectedCCA.publicDescription || "Details to be announced"}
                </p>

                {/* Schedule Info */}
                <Card className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    {(selectedCCA.meetingDay || selectedCCA.meetingTime) && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Schedule</p>
                          <p className="text-sm font-medium">
                            {selectedCCA.meetingDay || "TBD"}
                            {selectedCCA.meetingTime ? `, ${selectedCCA.meetingTime}` : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedCCA.location && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Venue</p>
                          <p className="text-sm font-medium">{selectedCCA.location}</p>
                        </div>
                      </div>
                    )}

                    {/* PIC Teachers */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-2">PIC (Person in Charge)</p>
                        <PICTeachersList
                          teachers={selectedCCA.picTeachers}
                          fallbackCoordinator={selectedCCA.coordinatorName}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements from sessions */}
                {selectedCCA.sessions.length > 0 && selectedCCA.sessions[0].requirements && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Requirements</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {selectedCCA.sessions[0].requirements}
                    </p>
                  </div>
                )}

                {/* Operational Notes (Internal) - Teacher Only */}
                {selectedCCA.internalNotes && (
                  <div className="space-y-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Operational Notes (Internal)</span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-400 pl-6">{selectedCCA.internalNotes}</p>
                  </div>
                )}
              </div>

              {/* Dialog Footer with Manage Sessions button */}
              <DialogFooter className="flex-shrink-0 pt-4 border-t">
                {isCurrentTeacherPIC(selectedCCA) ? (
                  <Button
                    onClick={() => {
                      setManageSessionsActivity(selectedCCA);
                      setSelectedCCA(null);
                    }}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Sessions
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            variant="outline"
                            className="w-full opacity-50 cursor-not-allowed"
                            disabled
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Sessions
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Only PIC teachers can schedule/edit sessions.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Sessions Dialog (PIC only) */}
      {manageSessionsActivity && (
        <ManageSessionsDialog
          open={!!manageSessionsActivity}
          onOpenChange={(open) => {
            if (!open) {
              setManageSessionsActivity(null);
              // Refresh calendar sessions after closing
              refetchCcaSessions();
            }
          }}
          activity={manageSessionsActivity}
        />
      )}

      <EventDetailsSheet
        open={eventDetailsOpen}
        onOpenChange={setEventDetailsOpen}
        event={selectedEventDetails}
      />
    </TeacherAppLayout>
  );
}
