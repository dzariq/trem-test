import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Clock, ChevronDown, CalendarDays } from "lucide-react";
import schoolLogo from "@/assets/school-badge.png";
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
import { listCalendarEvents, type UpcomingEvent } from "@/data/calendar";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { supabase } from "@/lib/supabase";

type CCAActivity = {
  id: string;
  name: string;
  public_description?: string | null;
  category?: string | null;
  year_levels?: string[] | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  location?: string | null;
  is_active?: boolean | null;
};

type CCASession = {
  id: string;
  activity_id: string;
  is_cancelled?: boolean | null;
  session_date?: string | null;
  date?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  location?: string | null;
  venue?: string | null;
  activity?: {
    id: string;
    name: string;
    category?: string | null;
  } | null;
};

const normalizeYearLevels = (yearLevels: unknown): string[] => {
  if (Array.isArray(yearLevels)) {
    return yearLevels.map((level) => String(level));
  }
  if (typeof yearLevels === "string") {
    const trimmed = yearLevels.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const normalized = trimmed.startsWith("{")
        ? `[${trimmed.slice(1, -1)}]`
        : trimmed;
      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          return parsed.map((level) => String(level));
        }
      } catch {
        // Fall through to simple split.
      }
    }
    return trimmed
      .replace(/[{}[\]"]/g, "")
      .split(",")
      .map((level) => level.trim())
      .filter(Boolean);
  }
  return [];
};

export default function CalendarPage() {
  const { profile } = useMyProfile();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "calendar";
  
  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDay, setSelectedDay] = useState<string>(todayYmd);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<TagCategory | "all">("all");
  const [selectedTag, setSelectedTag] = useState<CalendarTag | null>(null);
  const [ccaCategoryFilter, setCcaCategoryFilter] = useState("all");
  const [selectedCCA, setSelectedCCA] = useState<CCAActivity | null>(null);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [availableActivities, setAvailableActivities] = useState<CCAActivity[]>([]);
  const [ccaSessions, setCcaSessions] = useState<CCASession[]>([]);
  const [ccaLoading, setCcaLoading] = useState(false);
  const [ccaError, setCcaError] = useState<string | null>(null);
  const {
    linkedStudents,
    loading: studentsLoading,
    error: studentsError,
    selectedStudentId,
    setSelectedStudentId,
  } = useStudentSelection();

  const [studentYearLevel, setStudentYearLevel] = useState<string | null>(null);

  const logSupabaseError = (label: string, error: any) => {
    if (!error) return;
    console.error(`[cca] ${label}`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  };
  // RLS policy notes (if queries return 401/403):
  // - cca_activities: allow SELECT for authenticated users
  // - cca_sessions: allow SELECT for authenticated users

  const roleForFilters = profile?.role === "student" ? "student" : "parent";
  // Filter events for parent/student role
  const visibleEvents = filterEventsByRole(events, roleForFilters);
  let filteredEvents = filterEventsByCategory(visibleEvents, categoryFilter);
  
  // Apply tag filter if a specific tag is selected
  if (selectedTag) {
    filteredEvents = filterEventsByTag(filteredEvents, selectedTag);
  }

  // Get CCA category color
  const getCcaCategoryColor = (category?: string | null) => {
    switch ((category ?? "").toLowerCase()) {
      case "sports": return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
      case "arts": return "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300";
      case "academic": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

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

  useEffect(() => {
    let isMounted = true;
    const loadCcaData = async () => {
      if (!selectedStudentId) {
        setCcaLoading(false);
        setCcaError(null);
        setAvailableActivities([]);
        setCcaSessions([]);
        setStudentYearLevel(null);
        return;
      }

      setCcaLoading(true);
      setCcaError(null);

      try {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id,name,year_level")
          .eq("id", selectedStudentId)
          .maybeSingle();
        if (studentError) {
          logSupabaseError("students year_level", studentError);
          setCcaError(studentError.message);
        }
        const yearLevel = studentData?.year_level ?? null;

        const { data, error } = await supabase
          .from("cca_activities")
          .select("id,name,public_description,category,year_levels,meeting_day,meeting_time,location,is_active")
          .eq("is_active", true);
        if (error) {
          logSupabaseError("cca_activities available", error);
          setCcaError(error.message);
        }
        const allActivities = (data as CCAActivity[]) ?? [];
        const eligibleActivities = allActivities.filter((activity) => {
          const levels = normalizeYearLevels(activity.year_levels);
          if (levels.includes("All")) return true;
          if (!yearLevel) return false;
          return levels.includes(yearLevel);
        });

        const eligibleActivityIds = eligibleActivities.map((activity) => activity.id);
        const activityMap = new Map(
          eligibleActivities.map((activity) => [activity.id, activity])
        );
        let sessionData: CCASession[] = [];
        if (eligibleActivityIds.length > 0) {
          const { data, error } = await supabase
            .from("cca_sessions")
            .select("*")
            .in("activity_id", eligibleActivityIds)
            .eq("is_cancelled", false)
            .order("session_date", { ascending: true });
          if (error) {
            logSupabaseError("cca_sessions", error);
            setCcaError(error.message);
          }
          sessionData = ((data as CCASession[]) ?? []).map((session) => ({
            ...session,
            activity: activityMap.get(session.activity_id) ?? null,
          }));
        }

        if (isMounted) {
          setStudentYearLevel(yearLevel);
          setCcaSessions(sessionData);
          setAvailableActivities(eligibleActivities);
        }
        if (error) {
          setCcaError(error.message);
        }
      } catch (error: any) {
        logSupabaseError("cca load", error);
        if (isMounted) {
          setCcaError(error?.message ?? "Failed to load CCA data.");
          setAvailableActivities([]);
          setCcaSessions([]);
          setStudentYearLevel(null);
        }
      } finally {
        if (isMounted) {
          setCcaLoading(false);
        }
      }
    };

    loadCcaData();
    return () => {
      isMounted = false;
    };
  }, [selectedStudentId]);

  const matchesCcaCategory = useMemo(() => {
    return (category?: string | null) => {
      if (ccaCategoryFilter === "all") return true;
      return (category ?? "").toLowerCase() === ccaCategoryFilter.toLowerCase();
    };
  }, [ccaCategoryFilter]);

  const filteredSessions = useMemo(() => {
    return ccaSessions.filter((session) =>
      matchesCcaCategory(session.activity?.category)
    );
  }, [ccaSessions, matchesCcaCategory]);

  const filteredAvailableActivities = useMemo(() => {
    return availableActivities.filter((activity) =>
      matchesCcaCategory(activity.category)
    );
  }, [availableActivities, matchesCcaCategory]);

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
                    const eventDate = new Date(`${event.startDay}T00:00:00Z`);
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

            {/* Available CCA Activities */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Available CCA Activities</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredAvailableActivities.length}
                </Badge>
              </div>

              {ccaLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading CCA activities...
                </p>
              ) : ccaError ? (
                <p className="text-sm text-destructive text-center py-2">
                  {ccaError}
                </p>
              ) : availableActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No CCA activities available for this year level
                </p>
              ) : (
                <>
                  {filteredSessions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No upcoming CCA sessions
                    </p>
                  )}

                  {filteredSessions.map((session) => {
                    const dateValue =
                      session.session_date ?? session.start_datetime ?? session.date ?? "";
                    const dateObj = dateValue ? new Date(dateValue) : null;
                    const dateLabel = dateObj
                      ? dateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "TBD";
                    const timeLabel =
                      dateObj && session.start_datetime
                        ? dateObj.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : null;
                    return (
                      <Card key={session.id} className="bg-card border-border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {session.activity?.name ?? "CCA Session"}
                              </h4>
                              {session.activity?.category && (
                                <Badge
                                  className={getCcaCategoryColor(session.activity.category)}
                                  variant="secondary"
                                >
                                  {session.activity.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {dateLabel}
                                {timeLabel ? `, ${timeLabel}` : ""}
                              </span>
                            </div>
                            {session.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{session.location}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {filteredAvailableActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No CCA activities available.
                    </p>
                  ) : (
                    filteredAvailableActivities.map((activity) => (
                      <Card key={activity.id} className="bg-card border-border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{activity.name}</h3>
                              {activity.category && (
                                <Badge className={getCcaCategoryColor(activity.category)} variant="secondary">
                                  {activity.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {activity.meeting_day && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{activity.meeting_day}{activity.meeting_time ? `, ${activity.meeting_time}` : ""}</span>
                              </div>
                            )}
                            {activity.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{activity.location}</span>
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mt-3">
                            {activity.public_description ?? "Details to be announced"}
                          </p>

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
                    ))
                  )}
                </>
              )}
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
                  {selectedCCA.category && (
                    <Badge className={getCcaCategoryColor(selectedCCA.category)} variant="secondary">
                      {selectedCCA.category}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {selectedCCA.public_description ?? "Details to be announced"}
                </p>

                {/* Schedule Info */}
                <Card className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    {(selectedCCA.meeting_day || selectedCCA.meeting_time) && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Schedule</p>
                          <p className="text-sm font-medium">
                            {selectedCCA.meeting_day ?? "TBD"}{selectedCCA.meeting_time ? `, ${selectedCCA.meeting_time}` : ""}
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

                  </CardContent>
                </Card>
                {/* Requirements */}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
