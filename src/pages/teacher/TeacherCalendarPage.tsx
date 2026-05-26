import { useEffect, useState, useMemo, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCampus } from "@/contexts/CampusContext";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonthGridCalendar } from "@/components/calendar/MonthGridCalendar";
import { TimeGridCalendar } from "@/components/calendar/TimeGridCalendar";
import { CalendarViewSwitcher, type CalendarViewMode } from "@/components/calendar/CalendarViewSwitcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, User, Loader2, Eye, SlidersHorizontal, X } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";

import { format } from "date-fns";
import { TAG_CATEGORIES, type TagCategory, type CalendarTag } from "@/types/calendarTags";
import {
  filterEventsByRole,
  getEventBadgeColor,
  getEventBadgeLabel,
} from "@/lib/calendarUtils";
import { listCalendarEvents, type UpcomingEvent } from "@/data/calendar";
import { useCcaActivities, type CcaActivity } from "@/hooks/useCcaActivities";
import { useCcaSessionsCalendar, type CcaCalendarSession } from "@/hooks/useCcaSessionsCalendar";
import { getCcaTypeColor } from "@/components/cca/CcaTypeTabs";
import { useCcaTypesByCampus } from "@/hooks/useCcaTypes";
import { CcaFilterSheet } from "@/components/cca/CcaFilterSheet";
import { CcaDetailsSheet } from "@/components/cca/CcaDetailsSheet";
import { ManageSessionsSheet } from "@/components/cca/ManageSessionsSheet";
import { SessionDetailsSheet } from "@/components/cca/SessionDetailsSheet";
import { useAuth } from "@/contexts/AuthContext";
import { EventDetailsSheet } from "@/components/events/EventDetailsSheet";
import { UpcomingEventsSection } from "@/components/calendar/UpcomingEventsSection";
import { useUpcomingCcaSessions, type UpcomingCcaSession } from "@/hooks/useUpcomingCcaSessions";
import { CalendarFiltersSheet } from "@/components/calendar/CalendarFiltersSheet";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/calendar/PullToRefreshIndicator";
import { TEACHER_CATEGORY_ORDER, mapDbToCategory, mapDbToSubtype } from "@/lib/calendarCategorySubtypes";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { useCcaActivityFilter } from "@/hooks/useCcaActivityFilter";
import { cn } from "@/lib/utils";

export default function TeacherCalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeCampus } = useCampus();
  const teacherScope = useTeacherScope();
  const teacherYearLevels = useMemo(
    () => Array.from(new Set((teacherScope.allowedClassYears || []).map((c) => c.year_level).filter(Boolean))),
    [teacherScope.allowedClassYears]
  );
  const teacherClassNames = useMemo(
    () => Array.from(new Set((teacherScope.allowedClassYears || []).map((c) => c.class_name).filter(Boolean))),
    [teacherScope.allowedClassYears]
  );
  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDay, setSelectedDay] = useState<string>(todayYmd);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarViewMode>("month");
  const [ccaTypeFilter, setCcaTypeFilter] = useState("all");
  const [selectedCCA, setSelectedCCA] = useState<CcaActivity | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<UpcomingEvent | UpcomingCcaSession | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [manageSessionsActivity, setManageSessionsActivity] = useState<CcaActivity | null>(null);
  const [selectedSession, setSelectedSession] = useState<CcaCalendarSession | null>(null);
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  // Track which categories are selected and their subtypes
  const [categoryFilters, setCategoryFilters] = useState<Record<TagCategory, (CalendarTag | "all")[]>>({} as Record<TagCategory, (CalendarTag | "all")[]>);
  const [isAllSelected, setIsAllSelected] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    sessions: ccaSessions,
    loading: ccaSessionsLoading,
    refetch: refetchCcaSessions,
  } = useCcaSessionsCalendar({
    year: currentMonth.getFullYear(),
    month: currentMonth.getMonth() + 1,
    campusCode: activeCampus,
    scopeToTeacher: teacherScope.isTeacher,
    teacherYearLevels,
    teacherClassNames,
    teacherUserId: user?.id ?? null,
  });

  const { sessions: upcomingCcaSessions } = useUpcomingCcaSessions({
    role: "teacher",
    limit: 20,
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
    campusCode: activeCampus,
  });

  const { types: ccaTypes } = useCcaTypesByCampus(activeCampus);
  const ccaFilter = useCcaActivityFilter();
  const selectedTypeName =
    ccaTypeFilter === "all"
      ? "All categories"
      : ccaTypes.find((t) => t.id === ccaTypeFilter)?.name ?? "Filter";
  const [ccaFilterOpen, setCcaFilterOpen] = useState(false);

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

  const formatSessionTime = (startTime: string | null, endTime: string | null) => {
    if (!startTime && !endTime) return "All Day";
    const start = startTime || "--:--";
    const end = endTime || "--:--";
    return `${start} - ${end}`;
  };

  const getCcaCategoryColor = getCcaTypeColor;

  // CCA sessions always show alongside normal events for anyone they're assigned to.
  const ccaSessionsOnSelectedDate = ccaSessions.filter(
    (session) => session.sessionDate === selectedDay,
  );
  const gridCcaSessions = ccaSessions;

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const data = await listCalendarEvents(year, month, { role: "teacher", campusCode: activeCampus });
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
  }, [currentMonth, activeCampus]);

  // Pull-to-refresh: refetch events + CCA sessions
  const handleRefresh = async () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    await Promise.all([
      listCalendarEvents(year, month, { role: "teacher", campusCode: activeCampus })
        .then((data) => setEvents(data))
        .catch(() => {}),
      Promise.resolve(refetchCcaSessions()),
    ]);
  };
  const { ref: pullRef, pullDistance, refreshing } = usePullToRefresh<HTMLDivElement>({
    onRefresh: handleRefresh,
  });

  // Apply unified CCA permission filter: principal sees all, teachers see
  // activities where they are PIC OR have year-overlap with the scope.
  const filteredCCA = useMemo(() => {
    const base = filterByTypeId(ccaTypeFilter);
    return ccaFilter.apply(base);
  }, [filterByTypeId, ccaTypeFilter, ccaFilter]);

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

      <section className="px-4 pt-3" ref={pullRef}>
        <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />
        <div className="mt-3 space-y-4">
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
                  if (session.activityId) navigate(`/teacher/cca/${session.activityId}`);
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
                  if (session.activityId) navigate(`/teacher/cca/${session.activityId}`);
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
                events={filteredEvents}
                ccaSessions={upcomingCcaSessions}
                onEventClick={openEventDetails}
                onCcaSessionClick={(session, el) => {
                  el?.blur?.();
                  if (session.activityId) navigate(`/teacher/cca/${session.activityId}`);
                }}
              />
            )}
        </div>
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
          campusCode={activeCampus}
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
          kind: selectedSession.kind,
          classesInvolved: selectedSession.classesInvolved,
        } : null}
        isPIC={selectedSession ? isTeacherPICOfSession(selectedSession) : false}
        canManageAttendance={selectedSession ? isTeacherPICOfSession(selectedSession) : false}
        campusCode={activeCampus}
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
    </TeacherAppLayout>
  );
}
