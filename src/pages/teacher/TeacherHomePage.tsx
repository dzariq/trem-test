import { useCallback, useEffect, useMemo, useState } from "react";
import { formatClassDisplay } from "@/lib/utils";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { UpcomingEvents } from "@/components/home/UpcomingEvents";
import { TeacherQuickLinks } from "@/components/home/TeacherQuickLinks";
import TeacherWelcomeQuote from "@/components/home/TeacherWelcomeQuote";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";
import { GeometricBackgroundPattern } from "@/components/home/GeometricBackgroundPattern";
import { SecondaryNavBar } from "@/components/layout/SecondaryNavBar";
import { BookOpen, Users, Clock, FileText, Calendar, AlertTriangle, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import schoolBadge from "@/assets/school-badge.png";
import heroBanner from "@/assets/teacher-hero-banner.webp";
import { teacherProfile } from "@/data/teacherMockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { differenceInDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { listAnnouncements, markAnnouncementRead, type Announcement } from "@/data/announcements";
import { useNavigate } from "react-router-dom";
import { getUpcomingEvents, listUpcomingEvents, type UpcomingEvent } from "@/data/calendar";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useTeacherScope } from "@/hooks/useTeacherScope";
import { useCampus } from "@/contexts/CampusContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import {
  buildGradeInputsFromExistingGrades,
  computeGradeEntryStats,
  fetchAcademicPeriods,
  fetchExistingGrades,
  fetchStudentsByClass,
} from "@/data/gradeEntry";
import { useUpcomingDeadlines } from "@/hooks/useUpcomingDeadlines";
import { useUpcomingCcaSessions } from "@/hooks/useUpcomingCcaSessions";
import { useRefreshOnAppResume } from "@/hooks/useRefreshOnAppResume";

type PendingGradeSummary = {
  class: string;
  subject: string;
  count: number;
};

const getDeadlineIcon = (source: "examinations" | "calendar_events") =>
  source === "examinations" ? FileText : Calendar;

const getDeadlineColor = (daysLeft: number) => {
  if (daysLeft < 8) return "bg-destructive/10 border-destructive/30 text-destructive";
  return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400";
};

const getDaysLeftBadge = (daysLeft: number) => {
  if (daysLeft <= 0) return { text: "Overdue", variant: "outline" as const };
  if (daysLeft === 1) return { text: "Tomorrow", variant: "outline" as const };
  return { text: `${daysLeft}d left`, variant: "outline" as const };
};

export default function TeacherHomePage() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useMyProfile();
  const { activeCampus } = useCampus();
  const teacherScope = useTeacherScope();
  const [selectedClass, setSelectedClass] = useState(teacherProfile.classes[0]);
  const [showPendingGrades, setShowPendingGrades] = useState(false);
  const [showDeadlines, setShowDeadlines] = useState(false);
  const [showDoneDeadlines, setShowDoneDeadlines] = useState(false);
  const [doneDeadlineIds, setDoneDeadlineIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("teacher_done_deadlines");
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set<string>();
    }
  });

  const toggleDeadlineDone = (id: string) => {
    setDoneDeadlineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("teacher_done_deadlines", JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  const [timetablePdfOpen, setTimetablePdfOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, total: 0 });
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [pendingGrades, setPendingGrades] = useState<PendingGradeSummary[]>([]);
  const [pendingGradesLoading, setPendingGradesLoading] = useState(false);
  const { items: deadlines, loading: deadlinesLoading } = useUpcomingDeadlines(5, activeCampus);
  
  // Fetch upcoming CCA sessions for teachers (PIC activities)
  const { sessions: ccaSessions, loading: ccaLoading } = useUpcomingCcaSessions({
    role: "teacher",
    limit: 10,
  });

  const selectedClassName = teacherScope.isTeacher
    ? teacherScope.selectedClassYear?.class_name ?? ""
    : selectedClass;

  const totalPendingGrades = useMemo(
    () => pendingGrades.reduce((sum, item) => sum + item.count, 0),
    [pendingGrades]
  );

  const logSupabaseError = (
    context: string,
    error: { code?: string; message?: string; details?: string; hint?: string }
  ) => {
    console.error(`[${context}]`, {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  };

  useEffect(() => {
    if (!teacherScope.isTeacher) return;
    if (!selectedClassName) {
      setAttendanceSummary({ present: 0, total: 0 });
      return;
    }

    let isMounted = true;
    const loadAttendanceSummary = async () => {
      setAttendanceLoading(true);
      try {
        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select("id")
          .eq("class", selectedClassName)
          .eq("archived", false);

        if (studentsError) {
          logSupabaseError("teacherHome/students", studentsError);
          throw new Error(studentsError.message);
        }

        const total = students?.length ?? 0;
        const today = format(new Date(), "yyyy-MM-dd");

        const { data: attendanceRows, error: attendanceError } = await supabase
          .from("attendance")
          .select("id")
          .eq("class", selectedClassName)
          .eq("date", today)
          .in("status", ["present", "late"]);

        if (attendanceError) {
          logSupabaseError("teacherHome/attendance", attendanceError);
          throw new Error(attendanceError.message);
        }

        if (isMounted) {
          setAttendanceSummary({
            present: attendanceRows?.length ?? 0,
            total,
          });
        }
      } catch (err) {
        if (isMounted) {
          setAttendanceSummary({ present: 0, total: 0 });
          toast({
            title: "Attendance unavailable",
            description: "Unable to load today's attendance.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setAttendanceLoading(false);
        }
      }
    };

    loadAttendanceSummary();
    return () => {
      isMounted = false;
    };
  }, [selectedClassName, teacherScope.isTeacher]);

  useEffect(() => {
    if (!teacherScope.isTeacher) return;
    if (teacherScope.loading) return;
    if (!selectedClassName) {
      setPendingGrades([]);
      return;
    }

    let isMounted = true;
    const loadPendingGrades = async () => {
      setPendingGradesLoading(true);
      try {
        const classYearId =
          teacherScope.allowedClassYears.find(
            (cls) => cls.class_name === selectedClassName
          )?.id ?? teacherScope.selectedClassYearId;
        if (!classYearId) {
          if (isMounted) setPendingGrades([]);
          return;
        }

        const allowedSubjects = await teacherScope.getAllowedSubjects(classYearId);
        if (allowedSubjects.length === 0) {
          if (isMounted) setPendingGrades([]);
          return;
        }

        const students = await fetchStudentsByClass(selectedClassName);
        const studentIds = students.map((student) => student.id);
        if (studentIds.length === 0) {
          if (isMounted) setPendingGrades([]);
          return;
        }

        const periods = await fetchAcademicPeriods();
        const openPeriod =
          periods.find((period) => period.is_open_for_grading) || periods[0];
        if (!openPeriod) {
          if (isMounted) setPendingGrades([]);
          return;
        }

        const summaries = await Promise.all(
          allowedSubjects.map(async (subject) => {
            const grades = await fetchExistingGrades(
              studentIds,
              subject.id,
              openPeriod.id
            );
            const stats = computeGradeEntryStats(
              students,
              buildGradeInputsFromExistingGrades(students, grades)
            );
            return {
              class: selectedClassName,
              subject: subject.name,
              count: stats.pending,
            } satisfies PendingGradeSummary;
          })
        );

        if (isMounted) {
          setPendingGrades(summaries);
        }
      } catch (err) {
        if (isMounted) {
          setPendingGrades([]);
          toast({
            title: "Pending grades unavailable",
            description: "Unable to load pending grades.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setPendingGradesLoading(false);
        }
      }
    };

    loadPendingGrades();
    return () => {
      isMounted = false;
    };
  }, [
    selectedClassName,
    teacherScope.allowedClassYears,
    teacherScope.getAllowedSubjects,
    teacherScope.loading,
    teacherScope.isTeacher,
    teacherScope.selectedClassYearId,
  ]);

  const upcomingDeadlines = deadlines
    .map((deadline) => ({
      ...deadline,
      dueDate: deadline.dueAt,
      daysLeft: differenceInDays(new Date(deadline.dueAt), new Date()),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const activeDeadlines = upcomingDeadlines.filter((d) => !doneDeadlineIds.has(d.id));
  const doneDeadlines = upcomingDeadlines.filter((d) => doneDeadlineIds.has(d.id));

  const upcomingEvents = useMemo(
    () =>
      getUpcomingEvents({
        events,
        fromDate: new Date(),
        limit: 5,
        role: "teacher",
        teacherUserId: profile?.user_id ?? null,
      }),
    [events, profile?.user_id]
  );

  const loadAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      const data = await listAnnouncements({ limit: 10, campusCode: activeCampus });
      setAnnouncements(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load announcements.";
      setAnnouncementsError(message);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [activeCampus]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const data = await listUpcomingEvents({ role: "teacher", limit: 10, campusCode: activeCampus });
      setEvents(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load events.";
      setEventsError(message);
    } finally {
      setEventsLoading(false);
    }
  }, [activeCampus]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auto-refresh on app resume / tab focus so the installed app doesn't show
  // stale announcements & events after being backgrounded.
  useRefreshOnAppResume(() => {
    loadAnnouncements();
    loadEvents();
  });

  const handleMarkAnnouncementRead = async (id: Announcement["id"]) => {
    try {
      await markAnnouncementRead(id);
      setAnnouncements(prev =>
        prev.map(item => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch {
      // Ignore read tracking errors to avoid blocking the UI.
    }
  };

  return (
    <TeacherAppLayout>
      <AppHeader 
        title="" 
        showNotifications 
        showProfile 
        leftContent={
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img 
              src={schoolBadge} 
              alt="School Badge" 
              className="h-16 w-auto -my-3 drop-shadow-md" 
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {profileLoading
                  ? "Loading..."
                  : profile?.full_name ?? profile?.email ?? "Teacher"}
              </p>
            </div>
          </div>
        }
      />

      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden">
        <img 
          src={heroBanner} 
          alt="School Banner" 
          className="block w-full h-40 sm:h-48 object-cover hero-breathe"
        />
        <TeacherWelcomeQuote />
      </div>

      {/* Content with Background Pattern */}
      <div className="relative -mt-8">
        <GeometricBackgroundPattern />
        
        <div className="relative z-10">
          {/* Quick Links */}
          <TeacherQuickLinks onTimetableClick={() => setTimetablePdfOpen(true)} />

          <div className="px-4 mt-4">
            <div className="bg-background/20 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/20 space-y-4">
              {/* Class Selector */}
              <Select
                value={
                  teacherScope.isTeacher
                    ? teacherScope.selectedClassYearId?.toString() ?? ""
                    : selectedClass
                }
                onValueChange={(value) => {
                  if (teacherScope.isTeacher) {
                    if (!value) return;
                    const nextId = Number(value);
                    if (Number.isFinite(nextId)) {
                      teacherScope.setSelectedClassYearId(nextId);
                    }
                    return;
                  }
                  setSelectedClass(value);
                }}
                disabled={teacherScope.isTeacher && teacherScope.allowedClassYears.length === 0}
              >
                <SelectTrigger className="w-full bg-white/30 backdrop-blur-sm border border-gray-400">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {teacherScope.isTeacher
                    ? teacherScope.allowedClassYears.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {formatClassDisplay(cls.class_name)}
                        </SelectItem>
                      ))
                    : teacherProfile.classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {formatClassDisplay(cls)}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>

              {/* Quick Stats - Now 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-emerald-500/20 backdrop-blur-sm border-emerald-500/30">
                  <CardContent className="p-3 text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {attendanceLoading ? "--/--" : `${attendanceSummary.present}/${attendanceSummary.total}`}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">Present Today</p>
                  </CardContent>
                </Card>
                <Card 
                  className="bg-amber-500/20 backdrop-blur-sm border-amber-500/30 cursor-pointer transition-all hover:shadow-md"
                  onClick={() => setShowPendingGrades(!showPendingGrades)}
                >
                  <CardContent className="p-3 text-center">
                    <BookOpen className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {pendingGradesLoading ? "--" : totalPendingGrades}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">Pending Grades</p>
                    <p className="text-[10px] text-amber-500 dark:text-amber-400 mt-1 flex items-center justify-center gap-0.5">
                      {showPendingGrades ? (
                        <>Hide <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>View <ChevronDown className="h-3 w-3" /></>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Grades Details */}
              {showPendingGrades && (
                <Card className="bg-amber-500/10 backdrop-blur-sm border-amber-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <BookOpen className="h-4 w-4" />
                      Pending Grades by Class
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingGradesLoading ? (
                      <p className="text-xs text-muted-foreground text-center">
                        Loading pending grades...
                      </p>
                    ) : pendingGrades.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center">
                        No pending grades for this class.
                      </p>
                    ) : (
                      pendingGrades.map((item, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/30 backdrop-blur-sm border border-amber-500/20"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {formatClassDisplay(item.class)}
                            </Badge>
                            <span className="text-sm text-foreground">{item.subject}</span>
                          </div>
                          <Badge className="bg-amber-500 text-white">
                            {item.count} students
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Deadlines Section */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDeadlines((v) => !v)}
                  className="w-full flex items-center justify-between mb-3"
                  aria-expanded={showDeadlines}
                >
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    Upcoming Deadlines
                    {!deadlinesLoading && activeDeadlines.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{activeDeadlines.length}</Badge>
                    )}
                  </h3>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showDeadlines && "rotate-180")} />
                </button>
                {showDeadlines && (
                <div className="space-y-2">
                  {deadlinesLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Loading deadlines...
                    </p>
                  ) : upcomingDeadlines.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No upcoming deadlines
                    </p>
                  ) : activeDeadlines.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      All caught up! 🎉
                    </p>
                  ) : (
                    activeDeadlines.map((deadline) => {
                      const Icon = getDeadlineIcon(deadline.source);
                      const badgeInfo = getDaysLeftBadge(deadline.daysLeft);

                      return (
                        <div 
                          key={deadline.id}
                          className={cn(
                            "rounded-lg border transition-all backdrop-blur-sm",
                            getDeadlineColor(deadline.daysLeft)
                          )}
                        >
                          <div className="flex items-center gap-3 p-3">
                            <Checkbox
                              checked={false}
                              onCheckedChange={() => toggleDeadlineDone(deadline.id)}
                              aria-label="Mark deadline done"
                              className="flex-shrink-0"
                            />
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {deadline.title}
                              </p>
                              <p className="text-xs opacity-70">
                                {format(new Date(deadline.dueDate), "d MMM yyyy")}
                              </p>
                              {deadline.subtitle && (
                                <p className="text-[11px] opacity-70 truncate">
                                  {deadline.subtitle}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={badgeInfo.variant} className="text-xs">
                                {badgeInfo.text}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                )}
                {!showDeadlines && !deadlinesLoading && activeDeadlines.length > 0 && (
                  <div className="space-y-1.5">
                    {activeDeadlines.slice(0, 3).map((deadline) => {
                      const badgeInfo = getDaysLeftBadge(deadline.daysLeft);
                      return (
                        <div
                          key={`sum-${deadline.id}`}
                          className={cn(
                            "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                            getDeadlineColor(deadline.daysLeft)
                          )}
                        >
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => toggleDeadlineDone(deadline.id)}
                            aria-label="Mark deadline done"
                            className="h-3.5 w-3.5 flex-shrink-0"
                          />
                          <span className="flex-1 min-w-0 truncate font-medium">{deadline.title}</span>
                          <Badge variant={badgeInfo.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                            {badgeInfo.text}
                          </Badge>
                        </div>
                      );
                    })}
                    {activeDeadlines.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowDeadlines(true)}
                        className="text-xs text-primary hover:underline w-full text-center pt-1"
                      >
                        +{activeDeadlines.length - 3} more
                      </button>
                    )}
                  </div>
                )}
                {doneDeadlines.length > 0 && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowDoneDeadlines((v) => !v)}
                      className="w-full flex items-center justify-between mb-2"
                      aria-expanded={showDoneDeadlines}
                    >
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        Done
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{doneDeadlines.length}</Badge>
                      </span>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", showDoneDeadlines && "rotate-180")} />
                    </button>
                    {showDoneDeadlines && (
                      <div className="space-y-1.5">
                        {doneDeadlines.map((deadline) => (
                          <div
                            key={`done-${deadline.id}`}
                            className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs"
                          >
                            <Checkbox
                              checked={true}
                              onCheckedChange={() => toggleDeadlineDone(deadline.id)}
                              aria-label="Mark deadline not done"
                              className="h-3.5 w-3.5 flex-shrink-0"
                            />
                            <span className="flex-1 min-w-0 truncate text-muted-foreground line-through">
                              {deadline.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        {announcementsLoading && (
          <div className="px-4 py-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Loading announcements...
              </CardContent>
            </Card>
          </div>
        )}

        {announcementsError && !announcementsLoading && (
          <div className="px-4 py-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center text-sm text-destructive">
                {announcementsError}
              </CardContent>
            </Card>
          </div>
        )}

        {!announcementsLoading && !announcementsError && (
          <AnnouncementCarousel
            announcements={announcements}
            onSeeAll={() => navigate("/teacher/announcements")}
            onMarkRead={handleMarkAnnouncementRead}
            enableListDrawer={false}
          />
        )}
        {(eventsLoading || ccaLoading) && (
          <div className="px-4 py-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Loading events...
              </CardContent>
            </Card>
          </div>
        )}

        {eventsError && !eventsLoading && (
          <div className="px-4 py-4">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6 text-center text-sm text-destructive">
                {eventsError}
              </CardContent>
            </Card>
          </div>
        )}

        {!eventsLoading && !ccaLoading && !eventsError && (
          <UpcomingEvents 
            events={upcomingEvents} 
            ccaSessions={ccaSessions}
            seeAllPath="/teacher/calendar" 
          />
        )}
        
        {/* Footer with faded school badge */}
        <div className="flex flex-col items-center justify-center py-8 mt-4">
          <img 
            src={schoolBadge} 
            alt="School Badge" 
            className="h-20 w-auto opacity-20 grayscale"
          />
          <p className="text-muted-foreground/50 text-xs mt-2">Collinz International School</p>
        </div>
        </div>
      </div>

      <PDFViewerDialog
        open={timetablePdfOpen}
        onOpenChange={setTimetablePdfOpen}
        pdfUrl="/documents/teacher-timetable.pdf"
        title="Teacher Timetable"
        downloadFileName="Teacher_Timetable_2026.pdf"
      />
    </TeacherAppLayout>
  );
}
