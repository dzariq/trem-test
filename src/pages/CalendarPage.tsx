import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonthGridCalendar } from "@/components/calendar/MonthGridCalendar";
import { TimeGridCalendar } from "@/components/calendar/TimeGridCalendar";
import { CalendarViewSwitcher, type CalendarViewMode } from "@/components/calendar/CalendarViewSwitcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MapPin, Clock, CalendarDays, User, Loader2, ArrowRightLeft, Users as UsersIcon, Mail, ClipboardList } from "lucide-react";
import schoolLogo from "@/assets/header-logo.png";
import { TAG_CATEGORIES, type TagCategory, type CalendarTag } from "@/types/calendarTags";
import {
  filterEventsByRole,
  getEventBadgeColor,
  getEventBadgeLabel,
} from "@/lib/calendarUtils";
import { listCalendarEvents, listUpcomingEvents, type UpcomingEvent } from "@/data/calendar";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useEligibleCcaActivities, type CcaActivity } from "@/hooks/useEligibleCcaActivities";
import { useStudentCcaEnrollments, type EnrolledCcaActivity } from "@/hooks/useStudentCcaEnrollments";
import { useCcaClubEnrollment } from "@/hooks/useCcaClubEnrollment";
import { PICTeachersList } from "@/components/cca/PICTeacherPill";
import { CcaTypeTabs, CcaKindTabs, getCcaTypeColor, getCcaBucket, getCcaBucketIcon, getCcaTypePillColor, type CcaKindFilter } from "@/components/cca/CcaTypeTabs";
import {
  CCA_BUCKET_LABEL,
  formatSessionDateShort,
  formatSessionTimeRange,
  getUpcomingSessions,
  getNextUpcomingSession,
} from "@/lib/ccaSessionFormat";
import { CcaDetailsSheet } from "@/components/cca/CcaDetailsSheet";
import { CcaActivityCard } from "@/components/cca/CcaActivityCard";
import { ClubSwitchConfirmDialog } from "@/components/cca/ClubSwitchConfirmDialog";
import { supabase } from "@/lib/supabase";
import { useCcaSessionsCalendar, type CcaCalendarSession } from "@/hooks/useCcaSessionsCalendar";
import { useUpcomingCcaSessions, type UpcomingCcaSession } from "@/hooks/useUpcomingCcaSessions";
import { EventDetailsSheet } from "@/components/events/EventDetailsSheet";
import { UpcomingEventsSection } from "@/components/calendar/UpcomingEventsSection";
import { CategoryFilterPill } from "@/components/calendar/CategoryFilterPill";
import { CalendarFiltersSheet } from "@/components/calendar/CalendarFiltersSheet";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/calendar/PullToRefreshIndicator";
import { 
  PARENT_CATEGORY_ORDER, 
  TEACHER_CATEGORY_ORDER,
  CATEGORY_PILL_STYLES,
  mapDbToCategory,
  mapDbToSubtype,
} from "@/lib/calendarCategorySubtypes";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";

export default function CalendarPage() {
  const { profile } = useMyProfile();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "calendar";

  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDay, setSelectedDay] = useState<string>(todayYmd);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarViewMode>("month");
  const [ccaKindFilter, setCcaKindFilter] = useState<CcaKindFilter>("all");
  const [selectedCCA, setSelectedCCA] = useState<CcaActivity | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<UpcomingEvent | UpcomingCcaSession | CcaCalendarSession | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [studentYearLevel, setStudentYearLevel] = useState<string | null>(null);

  // Club switching state
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [targetClub, setTargetClub] = useState<{ id: string; name: string } | null>(null);
  const [currentClubName, setCurrentClubName] = useState<string | null>(null);
  
  // State for viewing enrolled CCA details
  const [selectedEnrolledCCA, setSelectedEnrolledCCA] = useState<EnrolledCcaActivity | null>(null);

  const roleForFilters = profile?.role === "student" ? "student" : "parent";
  // Track which categories are selected and their subtypes
  const [categoryFilters, setCategoryFilters] = useState<Record<TagCategory, (CalendarTag | "all")[]>>({} as Record<TagCategory, (CalendarTag | "all")[]>);
  const [isAllSelected, setIsAllSelected] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    linkedStudents,
    loading: studentsLoading,
    error: studentsError,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
  } = useStudentSelection();

  useEffect(() => {
    if (!selectedStudentId) {
      setStudentYearLevel(null);
      return;
    }

    const fetchYearLevel = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("year_level")
        .eq("id", selectedStudentId)
        .maybeSingle();

      if (!error && data) {
        setStudentYearLevel(data.year_level);
      }
    };

    fetchYearLevel();
  }, [selectedStudentId]);

  // Fetch eligible CCA activities using the new hook
  const {
    activities: ccaActivities,
    loading: ccaLoading,
    error: ccaError,
    filterByTypeId,
    filterByKind,
    refetch: refetchActivities,
  } = useEligibleCcaActivities({
    studentId: selectedStudentId,
    includeInactive: false,
    campusCode: selectedStudent?.campus_code ?? null,
  });

  const {
    enrollments: enrolledCcas,
    loading: enrolledLoading,
    error: enrolledError,
    filterByTypeId: filterEnrolledByTypeId,
    filterByKind: filterEnrolledByKind,
    refetch: refetchEnrollments,
  } = useStudentCcaEnrollments({
    studentId: selectedStudentId,
  });

  // Club enrollment hook - pass role to block parent mutations
  const {
    switchClub,
    joinClub,
    enrolling,
    getCurrentEnrolledClub,
  } = useCcaClubEnrollment({
    studentId: selectedStudentId,
    userRole: profile?.role,
    onSuccess: () => {
      refetchEnrollments();
      refetchActivities();
      setSelectedCCA(null);
      setSwitchDialogOpen(false);
      setTargetClub(null);
    },
  });

  const {
    sessions: ccaSessions,
    loading: ccaSessionsLoading,
    refetch: refetchCcaSessions,
  } = useCcaSessionsCalendar({
    year: currentMonth.getFullYear(),
    month: currentMonth.getMonth() + 1,
    campusCode: selectedStudent?.campus_code ?? null,
    studentId: selectedStudentId,
    scopeToStudent: true,
  });

  const { sessions: upcomingCcaSessions } = useUpcomingCcaSessions({
    role: "parent",
    limit: 20,
  });

  const visibleEvents = filterEventsByRole(events, roleForFilters);

  // Get available categories based on role
  const availableCategories = useMemo(() => {
    return roleForFilters === "parent" ? PARENT_CATEGORY_ORDER : TEACHER_CATEGORY_ORDER;
  }, [roleForFilters]);

  // Check if event matches a category using DB fields
  const matchesCategory = (event: UpcomingEvent, category: TagCategory) => {
    // First check if any tags match the category
    const tags = Array.isArray(event.tags) ? event.tags : [];
    if (tags.some((tag) => TAG_CATEGORIES[tag] === category)) return true;
    
    // Use the improved mapping function
    const mappedCategory = mapDbToCategory(event.category || "", (event as any).eventType);
    if (mappedCategory === category) return true;
    
    return false;
  };

  // Check if event matches a specific subtype tag
  const matchesSubtype = (event: UpcomingEvent, subtype: CalendarTag) => {
    // Direct tag match
    const tags = Array.isArray(event.tags) ? event.tags : [];
    if (tags.includes(subtype)) return true;
    
    // Use improved mapping that includes title for better classification
    const mappedSubtype = mapDbToSubtype(
      event.category || "", 
      (event as any).eventType,
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

  const getCcaCategoryColor = getCcaTypeColor;

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

  const eventsForSelectedDate = filteredEvents.filter(
    (event) => selectedDay >= event.startDay && selectedDay <= event.endDay
  );

  const showCcaSessions = isAllSelected || activeCategories.includes("events");
  const ccaSessionsForSelectedDate = showCcaSessions
    ? ccaSessions.filter((session) => session.sessionDate === selectedDay)
    : [];

  const gridCcaSessions = showCcaSessions ? ccaSessions : [];

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const data = await listCalendarEvents(year, month, { role: profile?.role, campusCode: selectedStudent?.campus_code ?? null });
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
  }, [currentMonth, profile?.role, selectedStudent?.campus_code]);

  useEffect(() => {
    let isMounted = true;
    const loadUpcomingEvents = async () => {
      try {
        const data = await listUpcomingEvents({
          role: profile?.role,
          limit: 50,
          campusCode: selectedStudent?.campus_code ?? null,
        });
        if (isMounted) {
          setUpcomingEvents(data);
        }
      } catch {
        if (isMounted) {
          setUpcomingEvents([]);
        }
      }
    };

    loadUpcomingEvents();
    return () => {
      isMounted = false;
    };
  }, [profile?.role, selectedStudent?.campus_code]);

  const filteredCCA = useMemo(() => {
    // Filter by kind, then exclude already-enrolled activities
    const byKind = filterByKind(ccaKindFilter);
    const enrolledIds = new Set(enrolledCcas.map((e) => e.activityId));
    return byKind.filter((activity) => !enrolledIds.has(activity.id));
  }, [filterByKind, ccaKindFilter, enrolledCcas]);

  const filteredEnrolledCCA = useMemo(() => {
    return filterEnrolledByKind(ccaKindFilter);
  }, [filterEnrolledByKind, ccaKindFilter]);

  // Check if a given activity is currently enrolled
  const isEnrolledInActivity = (activityId: string): boolean => {
    return enrolledCcas.some((e) => e.activityId === activityId);
  };

  // Handle Join/Switch button click - wrapped in try-catch to prevent app freezing
  const handleJoinOrSwitch = async (activity: CcaActivity) => {
    try {
      const currentClub = await getCurrentEnrolledClub();

      if (currentClub && currentClub.id !== activity.id) {
        // Student is enrolled in a different club - show switch dialog
        setCurrentClubName(currentClub.name);
        setTargetClub({ id: activity.id, name: activity.name });
        setSwitchDialogOpen(true);
      } else if (!currentClub) {
        // Not enrolled in any club - show join dialog
        setCurrentClubName(null);
        setTargetClub({ id: activity.id, name: activity.name });
        setSwitchDialogOpen(true);
      }
      // If already in this club, do nothing (button shouldn't be shown)
    } catch (error) {
      console.error("[CalendarPage] Error in handleJoinOrSwitch:", error);
      // Don't show error toast - the hook handles it
    }
  };

  // Confirm switch/join action - wrapped in try-catch to prevent app freezing
  const handleConfirmSwitch = async () => {
    if (!targetClub) return;

    try {
      if (currentClubName) {
        await switchClub(targetClub.id, targetClub.name);
      } else {
        await joinClub(targetClub.id, targetClub.name);
      }
    } catch (error) {
      console.error("[CalendarPage] Error in handleConfirmSwitch:", error);
      setSwitchDialogOpen(false);
      setTargetClub(null);
    }
  };

  const getTeacherInChargeLabel = (activity: CcaActivity | EnrolledCcaActivity) => {
    if (activity.picTeachers.length > 0) {
      return activity.picTeachers.map((t) => t.fullName).join(", ");
    }
    if ('coordinatorName' in activity && activity.coordinatorName) {
      return activity.coordinatorName;
    }
    return null;
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

  // Pull-to-refresh: refetch calendar + upcoming events + CCA sessions + enrollments
  const handleRefresh = async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    await Promise.all([
      listCalendarEvents(year, month, { role: profile?.role, campusCode: selectedStudent?.campus_code ?? null })
        .then(setEvents)
        .catch(() => {}),
      listUpcomingEvents({ role: profile?.role, limit: 50, campusCode: selectedStudent?.campus_code ?? null })
        .then(setUpcomingEvents)
        .catch(() => {}),
      Promise.resolve(refetchCcaSessions()),
      Promise.resolve(refetchActivities()),
      Promise.resolve(refetchEnrollments()),
    ]);
  };
  const { ref: pullRef, pullDistance, refreshing } = usePullToRefresh<HTMLDivElement>({
    onRefresh: handleRefresh,
  });

  return (
    <RouteErrorBoundary fallbackLabel="Calendar">
    <AppLayout>
      <AppHeader
        showChildSelector
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
          </div>
        }
      />

      <section className="px-4 pt-3" ref={pullRef}>
        <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />
        <Tabs defaultValue={initialTab} className="w-full">
          <div className="pb-2">
            <TabsList className="grid w-full grid-cols-2 rounded-md bg-muted/40 p-1">
              <TabsTrigger
                value="calendar"
                className="rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Main Calendar
              </TabsTrigger>
              <TabsTrigger
                value="cca"
                className="rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                CCA Activities
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="mt-3 space-y-4">
            {/* Calendar Component */}
            {view === "month" && (
              <MonthGridCalendar
                month={currentMonth}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
                onMonthChange={(date) => {
                  setCurrentMonth(date);
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  setSelectedDay(`${date.getFullYear()}-${month}-01`);
                }}
                events={filteredEvents}
                ccaSessions={gridCcaSessions}
                onEventClick={openEventDetails}
                onSessionClick={(session) => {
                  setSelectedEventDetails(session);
                  setEventDetailsOpen(true);
                }}
                view={view}
                onViewChange={setView}
                onZoomToDay={(ymd) => {
                  setSelectedDay(ymd);
                  setView("day");
                }}
                onOpenFilters={() => setFiltersOpen(true)}
                hasActiveFilters={!isAllSelected}
              />
            )}

            {(view === "week" || view === "day") && (
              <TimeGridCalendar
                mode={view}
                date={parseDayKey(selectedDay)}
                selectedDay={selectedDay}
                onSelectDay={(ymd) => {
                  setSelectedDay(ymd);
                  const d = parseDayKey(ymd);
                  if (
                    d.getFullYear() !== currentMonth.getFullYear() ||
                    d.getMonth() !== currentMonth.getMonth()
                  ) {
                    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  }
                }}
                onDateChange={(d) => {
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  setSelectedDay(`${y}-${m}-${dd}`);
                  if (
                    d.getFullYear() !== currentMonth.getFullYear() ||
                    d.getMonth() !== currentMonth.getMonth()
                  ) {
                    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  }
                }}
                events={filteredEvents}
                ccaSessions={gridCcaSessions}
                onEventClick={openEventDetails}
                onSessionClick={(session) => {
                  setSelectedEventDetails(session);
                  setEventDetailsOpen(true);
                }}
                view={view}
                onViewChange={setView}
                onBackToMonth={() => setView("month")}
                onOpenFilters={() => setFiltersOpen(true)}
                hasActiveFilters={!isAllSelected}
              />
            )}

            {/* Upcoming Events with tab switcher (month view only) */}
            {view === "month" && (
              <UpcomingEventsSection
                events={upcomingEvents}
                ccaSessions={upcomingCcaSessions}
                onEventClick={openEventDetails}
                onCcaSessionClick={(session, el) => {
                  el?.blur?.();
                  setSelectedEventDetails(session);
                  setEventDetailsOpen(true);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="cca" className="mt-4 space-y-4">
            <CcaKindTabs
              selected={ccaKindFilter}
              onSelect={setCcaKindFilter}
            />

            {/* My CCAs (Enrolled) Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Enrolled CCA Activities</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredEnrolledCCA.length}
                </Badge>
              </div>

              {enrolledLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading enrolled CCAs...</span>
                </div>
              )}

              {enrolledError && (
                <div className="text-center py-4 text-destructive text-sm">
                  <p>Failed to load enrolled CCAs</p>
                </div>
              )}

              {!enrolledLoading && !enrolledError && filteredEnrolledCCA.length === 0 && (
                <Card className="bg-muted/30 border-dashed border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No enrolled CCAs yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Browse available activities below to join
                    </p>
                  </CardContent>
                </Card>
              )}

              {!enrolledLoading && !enrolledError && filteredEnrolledCCA.map((activity) => (
                <CcaActivityCard
                  key={`enrolled-${activity.enrollmentId}`}
                  activity={activity}
                  variant="enrolled"
                  onClick={() => setSelectedEnrolledCCA(activity)}
                />
              ))}
            </div>

            {/* Available CCA Activities List */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Available CCA Activities</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredCCA.length}
                </Badge>
                {studentYearLevel && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {studentYearLevel}
                  </Badge>
                )}
              </div>

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

              {/* Empty state: No student selected or no year level */}
              {!ccaLoading && !ccaError && !selectedStudentId && (
                <Card className="bg-muted/30 border-dashed border-border">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Please select a student to view eligible activities
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Empty state: Student has no year level */}
              {!ccaLoading && !ccaError && selectedStudentId && !studentYearLevel && (
                <Card className="bg-muted/30 border-dashed border-border">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Unable to determine student's year level
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please contact administration to update student information
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Empty state: No eligible activities */}
              {!ccaLoading && !ccaError && selectedStudentId && studentYearLevel && filteredCCA.length === 0 && (
                <Card className="bg-muted/30 border-dashed border-border">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No eligible CCA activities found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      There are no activities available for {studentYearLevel} students
                      {ccaKindFilter !== "all" ? " in this category" : ""}
                    </p>
                  </CardContent>
                </Card>
              )}

              {!ccaLoading && !ccaError && selectedStudentId && studentYearLevel && filteredCCA.map((activity) => {
                const alreadyEnrolled = isEnrolledInActivity(activity.id);

                return (
                  <CcaActivityCard
                    key={activity.id}
                    activity={activity}
                    variant="available"
                    isEnrolled={alreadyEnrolled}
                    onClick={() => setSelectedCCA(activity)}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* CCA Details Bottom Sheet */}
      <BottomSheet
        open={!!selectedCCA}
        onOpenChange={(open) => !open && setSelectedCCA(null)}
        snapPoints={[0, 0.75, 1]}
        defaultSnapPoint={0.75}
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{selectedCCA?.name}</span>
            {selectedCCA && (() => {
              const b = getCcaBucket(selectedCCA.kind ?? selectedCCA.category);
              const Icon = getCcaBucketIcon(b);
              return (
                <Badge
                  className={cn(getCcaTypePillColor(selectedCCA.kind ?? selectedCCA.category), "border gap-1")}
                  variant="outline"
                >
                  <Icon className="h-3 w-3" />
                  {CCA_BUCKET_LABEL[b]}
                </Badge>
              );
            })()}
          </div>
        }
        description="CCA details"
        bodyClassName="px-4 py-3 space-y-4"
      >
        {selectedCCA && (() => {
          const bucket = getCcaBucket(selectedCCA.kind ?? selectedCCA.category);
          const isEvent = bucket === "events";
          const upcomingSessions = getUpcomingSessions(selectedCCA.sessions, 3);
          const nextSession = getNextUpcomingSession(selectedCCA.sessions);
          const requirementsText = nextSession?.requirements || selectedCCA.sessions?.[0]?.requirements || null;
          return (
          <>
            <p className="text-sm text-muted-foreground">
              {selectedCCA.publicDescription || "Details to be announced"}
            </p>

            {selectedCCA.eligibleYears.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Eligible Years:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedCCA.eligibleYears.map((year) => (
                    <Badge key={year} variant="outline" className="text-xs">
                      {year}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {isEvent && selectedCCA.classesInvolved.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground mt-1">Classes:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedCCA.classesInvolved.map((cls) => (
                    <Badge key={cls} variant="outline" className="text-xs">
                      {cls}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Card className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl">
              <CardContent className="p-4 space-y-3">
                {!isEvent && (selectedCCA.meetingDay || selectedCCA.meetingTime) && (
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

                {!isEvent && selectedCCA.maxParticipants != null && selectedCCA.maxParticipants > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <UsersIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="text-sm font-medium">Up to {selectedCCA.maxParticipants} spots</p>
                    </div>
                  </div>
                )}

                {(selectedCCA.picTeachers.length > 0 || selectedCCA.coordinatorName) && (
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
                )}

                {selectedCCA.coordinatorEmail && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Contact</p>
                      <a
                        href={`mailto:${selectedCCA.coordinatorEmail}`}
                        className="text-sm font-medium text-primary underline-offset-2 hover:underline truncate block"
                      >
                        {selectedCCA.coordinatorEmail}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {isEvent && upcomingSessions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Upcoming Sessions</span>
                </div>
                <div className="space-y-2 pl-6">
                  {upcomingSessions.map((s) => (
                    <div key={s.id} className="rounded-lg border border-border bg-muted/30 p-2.5 text-sm">
                      <p className="font-medium text-foreground">
                        {formatSessionDateShort(s.sessionDate)}
                        {formatSessionTimeRange(s.startTime, s.endTime) && (
                          <span className="text-muted-foreground font-normal">
                            {" · "}
                            {formatSessionTimeRange(s.startTime, s.endTime)}
                          </span>
                        )}
                      </p>
                      {s.location && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {s.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {requirementsText && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Requirements</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">{requirementsText}</p>
              </div>
            )}

            {/* Join/Switch button in bottom sheet - Only show for non-parent roles */}
            {roleForFilters !== "parent" && !isEnrolledInActivity(selectedCCA.id) && (
              <Button
                className="w-full"
                onClick={() => handleJoinOrSwitch(selectedCCA)}
                disabled={enrolling}
              >
                {enrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : enrolledCcas.length > 0 ? (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Switch to this Club
                  </>
                ) : (
                  "Join this Club"
                )}
              </Button>
            )}

            {isEnrolledInActivity(selectedCCA.id) && (
              <div className="text-center py-2">
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  You are enrolled in this club
                </Badge>
              </div>
            )}
          </>
          );
        })()}
      </BottomSheet>

      {/* Enrolled CCA Details Sheet */}
      <CcaDetailsSheet
        open={!!selectedEnrolledCCA}
        onOpenChange={(open) => !open && setSelectedEnrolledCCA(null)}
        activity={selectedEnrolledCCA ? {
          id: selectedEnrolledCCA.id,
          name: selectedEnrolledCCA.name,
          publicDescription: selectedEnrolledCCA.publicDescription,
          internalNotes: null,
          category: selectedEnrolledCCA.category || "Indoor CCA",
          typeId: selectedEnrolledCCA.typeId,
          typeName: selectedEnrolledCCA.typeName,
          kind: selectedEnrolledCCA.kind,
          yearLevels: [],
          classesInvolved: [],
          meetingDay: selectedEnrolledCCA.meetingDay,
          meetingTime: selectedEnrolledCCA.meetingTime,
          location: selectedEnrolledCCA.location,
          isActive: true,
          maxParticipants: null,
          coordinatorName: null,
          coordinatorEmail: null,
          allowFreeText: false,
          imageUrl: selectedEnrolledCCA.imageUrl,
          venue: null,
          picTeachers: selectedEnrolledCCA.picTeachers.map((t, idx) => ({
            id: `teacher-${idx}`,
            teacherUserId: "",
            role: t.role || "PIC",
            isPrimary: t.isPrimary || false,
            fullName: t.fullName,
            departments: t.departments,
          })),
          sessions: [],
        } : null}
        isPIC={false}
      />

      <EventDetailsSheet
        open={eventDetailsOpen}
        onOpenChange={setEventDetailsOpen}
        event={selectedEventDetails}
      />

      {/* Club Switch Confirmation Dialog */}
      <ClubSwitchConfirmDialog
        open={switchDialogOpen}
        onOpenChange={setSwitchDialogOpen}
        currentClubName={currentClubName}
        newClubName={targetClub?.name || ""}
        onConfirm={handleConfirmSwitch}
        loading={enrolling}
      />

      <CalendarFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        availableCategories={availableCategories}
        isAllSelected={isAllSelected}
        categoryFilters={categoryFilters}
        setIsAllSelected={setIsAllSelected}
        setCategoryFilters={setCategoryFilters}
      />
    </AppLayout>
    </RouteErrorBoundary>
  );
}
