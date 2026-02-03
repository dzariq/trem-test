import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, Clock, CalendarDays, User, Loader2, ChevronDown, ArrowRightLeft } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_DISPLAY_NAMES, TAG_CATEGORIES, TagCategory, CalendarTag } from "@/types/calendarTags";
import {
  filterEventsByRole,
  getTagColor,
  getTagDisplayName,
} from "@/lib/calendarUtils";
import { listCalendarEvents, type UpcomingEvent } from "@/data/calendar";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useEligibleCcaActivities, type CcaActivity } from "@/hooks/useEligibleCcaActivities";
import { useStudentCcaEnrollments, type EnrolledCcaActivity } from "@/hooks/useStudentCcaEnrollments";
import { useCcaClubEnrollment } from "@/hooks/useCcaClubEnrollment";
import { PICTeachersList } from "@/components/cca/PICTeacherPill";
import { CcaTypeTabs, getCcaTypeColor } from "@/components/cca/CcaTypeTabs";
import { ClubSwitchConfirmDialog } from "@/components/cca/ClubSwitchConfirmDialog";
import { supabase } from "@/lib/supabase";
import { useCcaSessionsCalendar, type CcaCalendarSession } from "@/hooks/useCcaSessionsCalendar";
import { EventDetailsSheet } from "@/components/events/EventDetailsSheet";
import { UpcomingEventsSection } from "@/components/calendar/UpcomingEventsSection";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { profile } = useMyProfile();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "calendar";

  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDay, setSelectedDay] = useState<string>(todayYmd);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [ccaTypeFilter, setCcaTypeFilter] = useState("all");
  const [selectedCCA, setSelectedCCA] = useState<CcaActivity | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<UpcomingEvent | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [studentYearLevel, setStudentYearLevel] = useState<string | null>(null);

  // Club switching state
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [targetClub, setTargetClub] = useState<{ id: string; name: string } | null>(null);
  const [currentClubName, setCurrentClubName] = useState<string | null>(null);

  const roleForFilters = profile?.role === "student" ? "student" : "parent";
  const [selectedCategory, setSelectedCategory] = useState<TagCategory | "all">("all");
  const [selectedEventSubtype, setSelectedEventSubtype] = useState<CalendarTag | "all">("all");

  const {
    linkedStudents,
    loading: studentsLoading,
    error: studentsError,
    selectedStudentId,
    setSelectedStudentId,
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
    refetch: refetchActivities,
  } = useEligibleCcaActivities({
    studentId: selectedStudentId,
    includeInactive: false,
  });

  const {
    enrollments: enrolledCcas,
    loading: enrolledLoading,
    error: enrolledError,
    filterByTypeId: filterEnrolledByTypeId,
    refetch: refetchEnrollments,
  } = useStudentCcaEnrollments({
    studentId: selectedStudentId,
  });

  // Club enrollment hook
  const {
    switchClub,
    joinClub,
    enrolling,
    getCurrentEnrolledClub,
  } = useCcaClubEnrollment({
    studentId: selectedStudentId,
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
  } = useCcaSessionsCalendar({
    year: currentMonth.getFullYear(),
    month: currentMonth.getMonth() + 1,
  });

  const visibleEvents = filterEventsByRole(events, roleForFilters);

  const eventSubtypeOptions: { value: CalendarTag | "all"; label: string }[] = [
    { value: "all", label: "All Events" },
    { value: "special-event-major", label: "Special Event (Major)" },
    { value: "internal-event", label: "Internal Event" },
    { value: "external-event", label: "External Event" },
    { value: "open-day", label: "Open Day" },
    { value: "field-trip", label: "Field Trip" },
  ];

  const categoryOrder: TagCategory[] = useMemo(() => {
    const base: TagCategory[] = ["school-level", "exams", "holidays", "events", "students", "parents"];
    return base;
  }, []);

  const categoryPillStyles: Record<TagCategory, string> = {
    "school-level": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    "exams": "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    "holidays": "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    "events": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    "students": "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    "parents": "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
    "staff-admin": "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
    "due-dates": "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  };

  const availableCategories = categoryOrder;

  const matchesCategory = (event: UpcomingEvent, category: TagCategory) => {
    if (event.tags.some((tag) => TAG_CATEGORIES[tag] === category)) return true;
    const categoryText = (event.category || "").toLowerCase();
    if (category === "exams") return categoryText.includes("exam") || categoryText.includes("test") || categoryText.includes("assessment");
    if (category === "holidays") return categoryText.includes("holiday");
    if (category === "school-level") return categoryText.includes("academic") || categoryText.includes("school") || categoryText.includes("class");
    if (category === "events") return categoryText.includes("event") || categoryText.includes("activity") || categoryText.includes("meeting");
    if (category === "students") return categoryText.includes("student");
    if (category === "parents") return categoryText.includes("parent") || categoryText.includes("family");
    if (category === "staff-admin") return categoryText.includes("staff") || categoryText.includes("admin") || categoryText.includes("meeting");
    if (category === "due-dates") return categoryText.includes("due") || categoryText.includes("deadline");
    return false;
  };

  const matchesEventSubtype = (event: UpcomingEvent, subtype: CalendarTag) => {
    if (event.tags.includes(subtype)) return true;
    const categoryText = (event.category || "").toLowerCase();
    if (subtype === "special-event-major") return categoryText.includes("special") || categoryText.includes("major");
    if (subtype === "internal-event") return categoryText.includes("internal");
    if (subtype === "external-event") return categoryText.includes("external");
    if (subtype === "open-day") return categoryText.includes("open day");
    if (subtype === "field-trip") return categoryText.includes("field trip");
    return false;
  };

  const filteredEvents = useMemo(() => {
    let filtered = visibleEvents;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => matchesCategory(event, selectedCategory));
    }
    if (selectedEventSubtype !== "all" && (selectedCategory === "all" || selectedCategory === "events")) {
      filtered = filtered.filter((event) => matchesEventSubtype(event, selectedEventSubtype as CalendarTag));
    }
    return filtered;
  }, [visibleEvents, selectedCategory, selectedEventSubtype]);

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

  const showCcaSessions = selectedCategory === "all" || selectedCategory === "events";
  const ccaSessionsForSelectedDate = showCcaSessions
    ? ccaSessions.filter((session) => session.sessionDate === selectedDay)
    : [];

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
        const data = await listCalendarEvents(year, month, { role: profile?.role });
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
  }, [currentMonth, profile?.role]);

  const filteredCCA = useMemo(() => {
    return filterByTypeId(ccaTypeFilter);
  }, [filterByTypeId, ccaTypeFilter]);

  const filteredEnrolledCCA = useMemo(() => {
    return filterEnrolledByTypeId(ccaTypeFilter);
  }, [filterEnrolledByTypeId, ccaTypeFilter]);

  // Check if a given activity is currently enrolled
  const isEnrolledInActivity = (activityId: string): boolean => {
    return enrolledCcas.some((e) => e.activityId === activityId);
  };

  // Handle Join/Switch button click
  const handleJoinOrSwitch = async (activity: CcaActivity) => {
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
  };

  // Confirm switch/join action
  const handleConfirmSwitch = async () => {
    if (!targetClub) return;

    if (currentClubName) {
      await switchClub(targetClub.id, targetClub.name);
    } else {
      await joinClub(targetClub.id, targetClub.name);
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

  return (
    <AppLayout>
      <AppHeader
        leftContent={
          <div className="flex items-center gap-2">
            <img src={schoolLogo} alt="School Logo" className="h-16 w-auto -my-3 drop-shadow-md" />
            <h1 className="text-xl font-semibold text-foreground">Calendar</h1>
          </div>
        }
        rightContent={
          <Select
            value={selectedStudentId}
            onValueChange={setSelectedStudentId}
            disabled={studentsLoading || linkedStudents.length === 0}
          >
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Student" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {studentsLoading && (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              )}
              {!studentsLoading && studentsError && (
                <SelectItem value="error" disabled>
                  {studentsError}
                </SelectItem>
              )}
              {!studentsLoading && !studentsError && linkedStudents.length === 0 && (
                <SelectItem value="empty" disabled>
                  No linked students yet. Please contact admin.
                </SelectItem>
              )}
              {!studentsLoading && !studentsError && linkedStudents.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <section className="px-4 pt-3">
        <Tabs defaultValue={initialTab} className="w-full">
          <div className="sticky top-[64px] z-30 -mx-4 px-4 pb-2 bg-background/95 backdrop-blur">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted/40 p-1">
              <TabsTrigger
                value="calendar"
                className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Main Calendar
              </TabsTrigger>
              <TabsTrigger
                value="cca"
                className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                CCA Activities
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="mt-3 space-y-4">
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 pb-2">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                  selectedCategory === "all"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted/40 text-muted-foreground border-border"
                )}
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedEventSubtype("all");
                }}
              >
                All
              </button>

              {availableCategories.map((category) =>
                category === "events" ? (
                  <DropdownMenu key={category}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                          categoryPillStyles[category],
                          selectedCategory === category ? "ring-2 ring-primary/30" : "opacity-80"
                        )}
                        onClick={() => setSelectedCategory("events")}
                      >
                        Events
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={6} className="min-w-[200px]">
                      <DropdownMenuRadioGroup
                        value={selectedEventSubtype}
                        onValueChange={(value) => {
                          setSelectedCategory("events");
                          setSelectedEventSubtype(value as CalendarTag | "all");
                        }}
                      >
                        {eventSubtypeOptions.map((option) => (
                          <DropdownMenuRadioItem key={option.value} value={option.value}>
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button
                    key={category}
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                      categoryPillStyles[category],
                      selectedCategory === category ? "ring-2 ring-primary/30" : "opacity-80"
                    )}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedEventSubtype("all");
                    }}
                  >
                    {CATEGORY_DISPLAY_NAMES[category]}
                  </button>
                )
              )}
            </div>

            {/* Calendar Component */}
            <Card className="bg-card border-border shadow-sm overflow-hidden">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    onSelect={(date) => date && setSelectedDay(toDayString(date))}
                    onMonthChange={(date) => {
                      setCurrentMonth(date);
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      setSelectedDay(`${date.getFullYear()}-${month}-01`);
                    }}
                    className="rounded-md w-full max-w-md mx-auto"
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
                </div>
              </CardContent>
            </Card>

            {/* Events for Selected Date */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  {parseDayKey(selectedDay).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventsForSelectedDate.map((event) => (
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

                {/* CCA Sessions */}
                {ccaSessionsForSelectedDate.map((session) => {
                  const formatTimeRange = (start: string | null, end: string | null) => {
                    if (!start) return "All Day";
                    const formatTime = (t: string) => {
                      const [h, m] = t.split(":");
                      const hour = parseInt(h);
                      const ampm = hour >= 12 ? "PM" : "AM";
                      const hour12 = hour % 12 || 12;
                      return `${hour12}:${m} ${ampm}`;
                    };
                    return end ? `${formatTime(start)} - ${formatTime(end)}` : formatTime(start);
                  };

                  return (
                    <div
                      key={`cca-${session.id}`}
                      className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">
                            {session.customTitle || session.activityName}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                            CCA
                          </Badge>
                        </div>
                      </div>
                      <Badge className={getCcaCategoryColor(session.category)} variant="secondary">
                        {session.category}
                      </Badge>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeRange(session.startTime, session.endTime)}
                        </span>
                        {session.locationName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.locationName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {eventsForSelectedDate.length === 0 && ccaSessionsForSelectedDate.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No events scheduled for this day</p>
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

            {/* My CCAs (Enrolled) Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">My CCAs (Enrolled)</h3>
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
                <Card key={`enrolled-${activity.enrollmentId}`} className="bg-primary/5 border-primary/20 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">{activity.name}</h3>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2 w-fit">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary shrink-0 w-fit"
                        >
                          Enrolled
                        </Badge>
                        <Badge
                          className={`${getCcaCategoryColor(activity.category)} shrink-0 w-fit`}
                          variant="secondary"
                        >
                          {activity.category}
                        </Badge>
                      </div>
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
                    </div>

                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div className="flex items-start gap-2 min-w-0">
                        <User className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          {getTeacherInChargeLabel(activity) ? (
                            <PICTeachersList
                              teachers={activity.picTeachers}
                              fallbackCoordinator={null}
                              className="gap-2"
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Teacher in charge: Not assigned
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                      {ccaTypeFilter !== "all" ? " in this category" : ""}
                    </p>
                  </CardContent>
                </Card>
              )}

              {!ccaLoading && !ccaError && selectedStudentId && studentYearLevel && filteredCCA.map((activity) => {
                const alreadyEnrolled = isEnrolledInActivity(activity.id);

                return (
                  <Card key={activity.id} className="bg-card border-border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">{activity.name}</h3>
                          {activity.eligibleYears.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Years: {activity.eligibleYears.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 w-fit">
                          {alreadyEnrolled && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary shrink-0 w-fit"
                            >
                              Enrolled
                            </Badge>
                          )}
                          <Badge
                            className={`${getCcaCategoryColor(activity.category)} shrink-0 w-fit`}
                            variant="secondary"
                          >
                            {activity.category}
                          </Badge>
                        </div>
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
                      </div>

                      <div className="flex items-start justify-between gap-3 pt-1 mt-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <User className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            {getTeacherInChargeLabel(activity) ? (
                              <PICTeachersList
                                teachers={activity.picTeachers}
                                fallbackCoordinator={activity.coordinatorName}
                                className="gap-2"
                              />
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Teacher in charge: Not assigned
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-3">
                        {activity.publicDescription || "Details to be announced"}
                      </p>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedCCA(activity)}
                        >
                          View Details
                        </Button>
                        {!alreadyEnrolled && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleJoinOrSwitch(activity)}
                            disabled={enrolling}
                          >
                            {enrolling ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : enrolledCcas.length > 0 ? (
                              <>
                                <ArrowRightLeft className="h-4 w-4 mr-1" />
                                Switch
                              </>
                            ) : (
                              "Join Club"
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
            {selectedCCA && (
              <Badge className={getCcaCategoryColor(selectedCCA.category)} variant="secondary">
                {selectedCCA.category}
              </Badge>
            )}
          </div>
        }
        description="CCA details"
        bodyClassName="px-4 py-3 space-y-4"
      >
        {selectedCCA && (
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

            <Card className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl">
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
              </CardContent>
            </Card>

            {/* Join/Switch button in bottom sheet */}
            {!isEnrolledInActivity(selectedCCA.id) && (
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
        )}
      </BottomSheet>

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
    </AppLayout>
  );
}
