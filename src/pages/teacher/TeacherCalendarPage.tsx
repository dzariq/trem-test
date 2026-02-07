import { useEffect, useState, useMemo, type KeyboardEvent } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, User, Loader2, Eye } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";

import { format } from "date-fns";
import { TAG_CATEGORIES, type TagCategory, type CalendarTag } from "@/types/calendarTags";
import {
  filterEventsByRole,
  getTagColor,
  getTagDisplayName,
} from "@/lib/calendarUtils";
import { listCalendarEvents, type UpcomingEvent } from "@/data/calendar";
import { useCcaActivities, type CcaActivity } from "@/hooks/useCcaActivities";
import { useCcaSessionsCalendar, type CcaCalendarSession } from "@/hooks/useCcaSessionsCalendar";
import { CcaTypeTabs, getCcaTypeColor } from "@/components/cca/CcaTypeTabs";
import { CcaDetailsSheet } from "@/components/cca/CcaDetailsSheet";
import { ManageSessionsSheet } from "@/components/cca/ManageSessionsSheet";
import { SessionDetailsSheet } from "@/components/cca/SessionDetailsSheet";
import { useAuth } from "@/contexts/AuthContext";
import { EventDetailsSheet } from "@/components/events/EventDetailsSheet";
import { UpcomingEventsSection } from "@/components/calendar/UpcomingEventsSection";
import { CategoryFilterPill } from "@/components/calendar/CategoryFilterPill";
import { TEACHER_CATEGORY_ORDER, mapDbToCategory, mapDbToSubtype } from "@/lib/calendarCategorySubtypes";
import { cn } from "@/lib/utils";

export default function TeacherCalendarPage() {
  const { user } = useAuth();
  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDay, setSelectedDay] = useState<string>(todayYmd);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [ccaTypeFilter, setCcaTypeFilter] = useState("all");
  const [selectedCCA, setSelectedCCA] = useState<CcaActivity | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<UpcomingEvent | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [manageSessionsActivity, setManageSessionsActivity] = useState<CcaActivity | null>(null);
  const [selectedSession, setSelectedSession] = useState<CcaCalendarSession | null>(null);
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  // Track which categories are selected and their subtypes
  const [categoryFilters, setCategoryFilters] = useState<Record<TagCategory, (CalendarTag | "all")[]>>({} as Record<TagCategory, (CalendarTag | "all")[]>);
  const [isAllSelected, setIsAllSelected] = useState(true);

  const {
    sessions: ccaSessions,
    loading: ccaSessionsLoading,
    refetch: refetchCcaSessions,
  } = useCcaSessionsCalendar({
    year: currentMonth.getFullYear(),
    month: currentMonth.getMonth() + 1,
  });

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

  // Check if teacher is PIC of a session's activity
  const isTeacherPICOfSession = useMemo(() => {
    return (session: CcaCalendarSession): boolean => {
      if (!user?.id) return false;
      // Find the activity for this session
      const activity = ccaActivities.find((a) => a.id === session.activityId);
      if (!activity) return false;
      return isCurrentTeacherPIC(activity);
    };
  }, [user?.id, ccaActivities, isCurrentTeacherPIC]);

  const visibleEvents = filterEventsByRole(events, "teacher");

  // Use shared category order for teachers
  const availableCategories = TEACHER_CATEGORY_ORDER;

  // Check if event matches a category using DB fields
  const matchesCategory = (event: UpcomingEvent, category: TagCategory) => {
    // First check if any tags match the category
    if (event.tags.some((tag) => TAG_CATEGORIES[tag] === category)) return true;
    
    // Use the improved mapping function
    const mappedCategory = mapDbToCategory(event.category || "", event.eventType);
    if (mappedCategory === category) return true;
    
    return false;
  };

  // Check if event matches a specific subtype tag
  const matchesSubtype = (event: UpcomingEvent, subtype: CalendarTag) => {
    // Direct tag match
    if (event.tags.includes(subtype)) return true;
    
    // Use improved mapping that includes title for better classification
    const mappedSubtype = mapDbToSubtype(
      event.category || "", 
      event.eventType,
      event.title || ""
    );
    return mappedSubtype === subtype;
  };

  // Get list of active categories (those with selections)
  const activeCategories = useMemo(() => {
    return Object.entries(categoryFilters)
      .filter(([_, subtypes]) => subtypes.length > 0)
      .map(([cat]) => cat as TagCategory);
  }, [categoryFilters]);

  // Filter events based on selected categories and their subtypes
  const filteredEvents = useMemo(() => {
    // If "All" is selected, show all events
    if (isAllSelected || activeCategories.length === 0) {
      return visibleEvents;
    }
    
    // Filter to events that match ANY of the selected categories
    return visibleEvents.filter((event) => {
      return activeCategories.some((category) => {
        // Check if event matches the category
        if (!matchesCategory(event, category)) return false;
        
        // Check subtypes within the category
        const subtypes = categoryFilters[category] || [];
        if (subtypes.includes("all") || subtypes.length === 0) {
          return true; // All subtypes in this category
        }
        
        // Check if event matches any of the selected subtypes
        return subtypes.some((subtype) => matchesSubtype(event, subtype as CalendarTag));
      });
    });
  }, [visibleEvents, isAllSelected, activeCategories, categoryFilters]);

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

  // Show CCA sessions when viewing all or event-related filters.
  const showCcaSessions = isAllSelected || activeCategories.includes("events");
  const ccaSessionsOnSelectedDate = showCcaSessions
    ? ccaSessions.filter((session) => session.sessionDate === selectedDay)
    : [];

  const formatSessionTime = (startTime: string | null, endTime: string | null) => {
    if (!startTime && !endTime) return "All Day";
    const start = startTime || "--:--";
    const end = endTime || "--:--";
    return `${start} - ${end}`;
  };

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

  if (showCcaSessions) {
    ccaSessions.forEach((session) => {
      if (session.sessionDate) {
        eventDaySet.add(session.sessionDate);
      }
    });
  }

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

  const filteredCCA = filterByTypeId(ccaTypeFilter);

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

      <section className="px-4 pt-3">
        <Tabs defaultValue="calendar" className="w-full">
          <div className="pb-2">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/40 p-1">
              <TabsTrigger
                value="calendar"
                className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Calendar
              </TabsTrigger>
              <TabsTrigger
                value="cca"
                className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                CCA Schedule
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="mt-3 space-y-4">
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 pb-2">
              {/* All button */}
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                  isAllSelected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted/40 text-muted-foreground border-border"
                )}
                onClick={() => {
                  setIsAllSelected(true);
                  setCategoryFilters({} as Record<TagCategory, (CalendarTag | "all")[]>);
                }}
              >
                All
              </button>

              {/* Category pills with dropdowns */}
              {availableCategories.map((category) => {
                const subtypes = categoryFilters[category] || [];
                const isSelected = subtypes.length > 0;
                
                return (
                  <CategoryFilterPill
                    key={category}
                    category={category}
                    isSelected={isSelected}
                    selectedSubtypes={subtypes.length > 0 ? subtypes : ["all"]}
                    onToggleCategory={(cat) => {
                      setIsAllSelected(false);
                      setCategoryFilters((prev) => {
                        const current = prev[cat] || [];
                        if (current.length > 0) {
                          // Deselect this category
                          const newFilters = { ...prev };
                          delete newFilters[cat];
                          // If no categories left, select All
                          if (Object.keys(newFilters).length === 0) {
                            setIsAllSelected(true);
                          }
                          return newFilters;
                        } else {
                          // Select this category with "all" subtypes
                          return { ...prev, [cat]: ["all"] };
                        }
                      });
                    }}
                    onSubtypeChange={(cat, subtypes) => {
                      setIsAllSelected(false);
                      setCategoryFilters((prev) => ({
                        ...prev,
                        [cat]: subtypes,
                      }));
                    }}
                  />
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
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedSession(session);
                        setSessionDetailsOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Session
                    </Button>
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

            {/* Upcoming Events with tab switcher */}
            <UpcomingEventsSection
              events={filteredEvents}
              onEventClick={openEventDetails}
            />
          </TabsContent>

          <TabsContent value="cca" className="mt-4 space-y-4">
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

      {/* CCA Details - Responsive: BottomSheet on mobile, centered Dialog on desktop */}
      <CcaDetailsSheet
        open={!!selectedCCA}
        onOpenChange={(open) => !open && setSelectedCCA(null)}
        activity={selectedCCA}
        isPIC={selectedCCA ? isCurrentTeacherPIC(selectedCCA) : false}
        onManageSessions={() => {
          if (selectedCCA) {
            setManageSessionsActivity(selectedCCA);
            setSelectedCCA(null);
          }
        }}
      />

      {/* Manage Sessions Bottom Sheet (PIC only) — replaces old Dialog */}
      {manageSessionsActivity && (
        <ManageSessionsSheet
          open={!!manageSessionsActivity}
          onOpenChange={(open) => {
            if (!open) {
              setManageSessionsActivity(null);
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

      {/* Session Details Sheet */}
      <SessionDetailsSheet
        open={sessionDetailsOpen}
        onOpenChange={(open) => {
          setSessionDetailsOpen(open);
          if (!open) {
            setSelectedSession(null);
            refetchCcaSessions();
          }
        }}
        session={selectedSession ? {
          id: selectedSession.id,
          activityId: selectedSession.activityId,
          activityName: selectedSession.activityName,
          sessionDate: selectedSession.sessionDate,
          startTime: selectedSession.startTime,
          endTime: selectedSession.endTime,
          locationName: selectedSession.locationName,
          customTitle: selectedSession.customTitle,
          description: selectedSession.description,
          requirements: selectedSession.requirements,
          isCancelled: selectedSession.isCancelled,
          category: selectedSession.category,
        } : null}
        isPIC={selectedSession ? isTeacherPICOfSession(selectedSession) : false}
      />
    </TeacherAppLayout>
  );
}
