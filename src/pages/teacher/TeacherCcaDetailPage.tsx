import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users as UsersIcon,
  User,
  Mail,
  ClipboardList,
  FileText,
  Plus,
  Pencil,
  XCircle,
  RotateCcw,
  Trash2,
  Loader2,
  Image as ImageIcon,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, parseISO, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

import { useCampus } from "@/contexts/CampusContext";
import {
  useTeacherInvolvedCcas,
  type InvolvedCcaActivity,
} from "@/hooks/useTeacherInvolvedCcas";
import { useCcaActivityPermissions } from "@/hooks/useCcaActivityPermissions";
import { useCcaSessions, type CcaSession, type CcaSessionFormData } from "@/hooks/useCcaSessions";
import { supabase } from "@/lib/supabase";
import { formatSessionTimeRange } from "@/lib/ccaSessionFormat";

import { CcaActivityImage } from "@/components/cca/CcaActivityImage";
import { CcaImageUpload } from "@/components/cca/CcaImageUpload";
import { PICTeachersList } from "@/components/cca/PICTeacherPill";
import { SessionFormDialog } from "@/components/cca/SessionFormDialog";
import { SessionAttendanceList } from "@/components/cca/SessionAttendanceList";
import { BusAttendanceList } from "@/components/cca/BusAttendanceList";
import { getCcaBucket, getCcaBucketIcon, getCcaTypePillColor } from "@/components/cca/CcaTypeTabs";
import { CCA_BUCKET_LABEL } from "@/lib/ccaSessionFormat";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/calendar/PullToRefreshIndicator";

async function lightHaptic() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* plugin not installed yet — no-op */
  }
}

type TabId = "overview" | "schedule" | "members" | "attendance" | "venue";

interface RosterStudent {
  id: string;
  name: string;
  className: string | null;
}

function useActivityRoster(activityId: string | null, enabled: boolean) {
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!enabled || !activityId) return;
      setLoading(true);
      try {
        const { data: enrolls } = await supabase
          .from("student_cca_enrollments")
          .select("student_id")
          .eq("cca_activity_id", activityId)
          .eq("status", "active");
        const ids = (enrolls ?? [])
          .map((r: any) => r.student_id)
          .filter(Boolean);
        if (ids.length === 0) {
          if (!cancelled) setStudents([]);
          return;
        }
        const { data: rows } = await supabase
          .from("students")
          .select("id, name, class")
          .in("id", ids);
        if (cancelled) return;
        const list = (rows ?? [])
          .map((s: any) => ({ id: s.id, name: s.name, className: s.class ?? null }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setStudents(list);
      } catch (e) {
        console.error("[useActivityRoster]", e);
        if (!cancelled) setStudents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activityId, enabled]);

  return { students, loading };
}

function formatSessionDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "EEE, MMM d, yyyy");
  } catch {
    return dateStr;
  }
}
function formatTime(s: string | null, e: string | null) {
  if (!s && !e) return null;
  return formatSessionTimeRange(s, e) || null;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Treat a session's custom title as meaningful only when it differs from
 * the parent activity name (case/whitespace-insensitive). Otherwise the
 * card heading falls back to the formatted session date.
 */
function sessionHeading(
  s: { customTitle: string | null; sessionDate: string },
  activityName: string,
) {
  const t = s.customTitle?.trim();
  if (t && t.toLowerCase() !== activityName.trim().toLowerCase()) return t;
  return formatSessionDate(s.sessionDate);
}

function hasMeaningfulTitle(
  customTitle: string | null,
  activityName: string,
) {
  const t = customTitle?.trim();
  return !!t && t.toLowerCase() !== activityName.trim().toLowerCase();
}

export default function TeacherCcaDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { activeCampus } = useCampus();
  const { activities, loading, refetch } = useTeacherInvolvedCcas(activeCampus);

  const activity: InvolvedCcaActivity | null = useMemo(
    () => activities.find((a) => a.id === activityId) ?? null,
    [activities, activityId]
  );

  const perms = useCcaActivityPermissions(activity);
  const canEdit = perms.canEdit;
  const isOutdoor = (activity?.kind || "").toLowerCase() === "outdoor";

  const [tab, setTab] = useState<TabId>("overview");
  const [localImageUrl, setLocalImageUrl] = useState<string | null | undefined>(undefined);
  const [imageOpen, setImageOpen] = useState(false);

  // Hoisted: single sessions source for Schedule + Attendance tabs.
  const sessionsHook = useCcaSessions({ activityId: activityId ?? "" });
  const { fetchSessions } = sessionsHook;
  useEffect(() => {
    if (activityId) fetchSessions();
  }, [activityId, fetchSessions]);

  // Pull-to-refresh: refetch activities + sessions
  const { ref: ptrRef, pullDistance, refreshing } = usePullToRefresh<HTMLDivElement>({
    onRefresh: async () => {
      await Promise.all([refetch(), fetchSessions()]);
    },
  });

  // Auto-scroll active tab pill into view on change
  const tabBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tabBarRef.current?.querySelector<HTMLButtonElement>(
      `[data-tab-id="${tab}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [tab]);

  const displayImageUrl =
    localImageUrl !== undefined
      ? localImageUrl
      : activity?.imageUrl || activity?.venue?.imageUrl || null;

  if (loading && !activity) {
    return (
      <TeacherAppLayout>
        <DetailHeader onBack={() => navigate("/teacher/cca")} title="Loading…" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </TeacherAppLayout>
    );
  }

  if (!activity) {
    return (
      <TeacherAppLayout>
        <DetailHeader onBack={() => navigate("/teacher/cca")} title="Not found" />
        <div className="p-6 text-center text-sm text-muted-foreground">
          <p>This CCA isn't available or you don't have access to it.</p>
          <Button className="mt-4" onClick={() => navigate("/teacher/cca")}>
            Back to My CCAs
          </Button>
        </div>
      </TeacherAppLayout>
    );
  }

  const bucket = getCcaBucket(activity.kind ?? activity.category);
  const BucketIcon = getCcaBucketIcon(bucket);
  const bucketLabel = CCA_BUCKET_LABEL[bucket];
  const bucketPill = getCcaTypePillColor(activity.kind ?? activity.category);

  // Outdoor activities use Bus list as their attendance flow — hide
  // generic Attendance tab to avoid two competing flows. Budget is
  // hidden until a backend exists.
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "members", label: isOutdoor ? "Bus list" : "Members" },
    ...(isOutdoor ? [] : [{ id: "attendance" as TabId, label: "Attendance" }]),
    { id: "venue", label: "Venue" },
  ];

  return (
    <TeacherAppLayout>
      <DetailHeader onBack={() => navigate("/teacher/cca")} title={activity.name} />
      <div ref={ptrRef}>
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />

      {/* Hero + title */}
      <div className="px-4 pt-3">
        {canEdit ? (
          <CcaImageUpload
            activityId={activity.id}
            activityName={activity.name}
            currentImageUrl={displayImageUrl}
            category={activity.category}
            typeName={activity.typeName}
            onUploadComplete={(url) => {
              setLocalImageUrl(url);
              refetch();
            }}
            className="mb-3"
          />
        ) : (
          <button
            type="button"
            onClick={() => displayImageUrl && setImageOpen(true)}
            className="block w-full mb-3 rounded-xl overflow-hidden"
            aria-label="View hero image"
          >
            <CcaActivityImage
              imageUrl={displayImageUrl}
              activityName={activity.name}
              category={activity.category}
              typeName={activity.typeName}
              variant="details"
            />
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">{activity.name}</h1>
          {perms.isActivityPIC && (
            <Badge variant="default" className="text-xs">PIC</Badge>
          )}
          <Badge className={cn(bucketPill, "border gap-1 text-xs")} variant="outline">
            <BucketIcon className="h-3 w-3" />
            {bucketLabel}
          </Badge>
        </div>
        {activity.typeName && activity.typeName !== bucketLabel && (
          <p className="text-xs text-muted-foreground mt-1">{activity.typeName}</p>
        )}
      </div>

      {/* Sticky tab bar with fade-edges */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+56px)] z-30 bg-background/95 backdrop-blur-sm border-b border-border mt-4 relative">
        <div
          ref={tabBarRef}
          className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                data-tab-id={t.id}
                onClick={() => {
                  setTab(t.id);
                  lightHaptic();
                }}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-all",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {/* right-edge fade hint */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background/95 to-transparent" />
      </div>

      <div className="px-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {tab === "overview" && <OverviewPanel activity={activity} />}
        {tab === "schedule" && (
          <SchedulePanel activity={activity} canEdit={canEdit} sessionsHook={sessionsHook} />
        )}
        {tab === "members" && !isOutdoor && (
          <MembersPanel activityId={activity.id} active={tab === "members"} />
        )}
        {tab === "members" && isOutdoor && (
          <BusAttendanceList activityId={activity.id} activityPerms={perms} />
        )}
        {tab === "attendance" && !isOutdoor && (
          <AttendancePanel
            activity={activity}
            canEdit={canEdit}
            campusCode={activeCampus}
            sessionsHook={sessionsHook}
          />
        )}
        {tab === "venue" && <VenuePanel activity={activity} />}
      </div>

      {/* Hero image lightbox */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-[95vw] p-0 bg-black/90 border-0">
          {displayImageUrl && (
            <img
              src={displayImageUrl}
              alt={activity.name}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </TeacherAppLayout>
  );
}

function DetailHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border safe-pt">
      <div className="w-full flex items-center gap-2 px-2 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
      </div>
    </header>
  );
}

/* -------- Overview -------- */
function OverviewPanel({ activity }: { activity: InvolvedCcaActivity }) {
  const isEvent = (activity.kind || "").toLowerCase() === "event";
  return (
    <div className="space-y-4">
      {activity.publicDescription && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {activity.publicDescription}
        </p>
      )}

      <Card className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
        <CardContent className="p-4 space-y-3">
          {!isEvent && (activity.meetingDay || activity.meetingTime) && (
            <InfoRow icon={<CalendarDays className="h-4 w-4 text-primary" />} label="Schedule">
              {activity.meetingDay || "TBD"}
              {activity.meetingTime ? `, ${activity.meetingTime}` : ""}
            </InfoRow>
          )}
          {activity.location && (
            <InfoRow icon={<MapPin className="h-4 w-4 text-primary" />} label="Venue">
              {activity.location}
            </InfoRow>
          )}
          {!isEvent && activity.maxParticipants != null && activity.maxParticipants > 0 && (
            <InfoRow icon={<UsersIcon className="h-4 w-4 text-primary" />} label="Capacity">
              Up to {activity.maxParticipants} spots
            </InfoRow>
          )}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">PIC (Person in Charge)</p>
              <PICTeachersList
                teachers={activity.picTeachers}
                fallbackCoordinator={activity.coordinatorName}
                variant="compact"
              />
            </div>
          </div>
          {activity.coordinatorEmail && (
            <InfoRow icon={<Mail className="h-4 w-4 text-primary" />} label="Contact">
              <a
                href={`mailto:${activity.coordinatorEmail}`}
                className="text-primary underline-offset-2 hover:underline"
              >
                {activity.coordinatorEmail}
              </a>
            </InfoRow>
          )}
        </CardContent>
      </Card>

      {activity.internalNotes && (
        <div className="space-y-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Operational Notes (Internal)
            </span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400 pl-6">
            {activity.internalNotes}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{children}</p>
      </div>
    </div>
  );
}

/* -------- Schedule -------- */
function SchedulePanel({
  activity,
  canEdit,
  sessionsHook,
}: {
  activity: InvolvedCcaActivity;
  canEdit: boolean;
  sessionsHook: ReturnType<typeof useCcaSessions>;
}) {
  const {
    sessions,
    loading,
    saving,
    createSession,
    updateSession,
    deleteSession,
    cancelSession,
  } = sessionsHook;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CcaSession | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CcaSession | null>(null);

  const active = sessions.filter((s) => !s.isCancelled);
  const cancelled = sessions.filter((s) => s.isCancelled);

  const handleSave = async (data: CcaSessionFormData) => {
    if (editing) return updateSession(editing.id, data);
    return createSession(data);
  };

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="text-xs text-muted-foreground text-center">
          Only PIC teachers can add or edit sessions.
        </p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No sessions scheduled yet</p>
          {canEdit && (
            <Button
              className="mt-4"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add your first session
            </Button>
          )}
        </div>
      )}

      {!loading && active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Upcoming ({active.length})
          </p>
          {active.map((s) => (
            <Card key={s.id} className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {sessionHeading(s, activity.name)}
                    </p>
                    {hasMeaningfulTitle(s.customTitle, activity.name) && (
                      <p className="text-xs text-muted-foreground">
                        {formatSessionDate(s.sessionDate)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      {formatTime(s.startTime, s.endTime) && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(s.startTime, s.endTime)}
                        </span>
                      )}
                      {s.locationName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {s.locationName}
                        </span>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditing(s);
                          setFormOpen(true);
                        }}
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => cancelSession(s.id, true)}
                        disabled={saving}
                        title="Cancel"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteConfirm(s)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && cancelled.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Cancelled ({cancelled.length})
          </p>
          {cancelled.map((s) => (
            <Card key={s.id} className="bg-muted/30 border-border opacity-60">
              <CardContent className="p-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-muted-foreground line-through">
                    {sessionHeading(s, activity.name)}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:bg-primary/10"
                      onClick={() => cancelSession(s.id, false)}
                      disabled={saving}
                      title="Restore"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirm(s)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SessionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        session={editing}
        saving={saving}
        onSave={handleSave}
        allowFreeText={activity.allowFreeText}
        activityName={activity.name}
      />

      {/* Sticky FAB for PIC quick-add */}
      {canEdit && (
        <button
          type="button"
          onClick={() => {
            lightHaptic();
            setEditing(null);
            setFormOpen(true);
          }}
          disabled={saving}
          aria-label="Add session"
          className="fixed right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition disabled:opacity-50"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirm) await deleteSession(deleteConfirm.id);
                setDeleteConfirm(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------- Members -------- */
function MembersPanel({ activityId, active }: { activityId: string; active: boolean }) {
  const { students, loading } = useActivityRoster(activityId, active);
  const [q, setQ] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading members…
      </div>
    );
  }
  if (students.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        <UsersIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
        No students enrolled yet.
      </div>
    );
  }

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          (s.className ?? "").toLowerCase().includes(needle),
      )
    : students;

  // Group by class for easier scanning
  const grouped = filtered.reduce<Record<string, RosterStudent[]>>((acc, s) => {
    const key = s.className || "Unassigned";
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  const classNames = Object.keys(grouped).sort();

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${students.length} members…`}
          className="pl-9 pr-9 h-10"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          No members match "{q}".
        </p>
      ) : (
        classNames.map((cls) => (
          <Card key={cls} className="rounded-xl">
            <CardContent className="p-0">
              <div className="px-4 py-2.5 border-b flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {cls}
                </span>
                <span className="text-xs text-muted-foreground">
                  {grouped[cls].length}
                </span>
              </div>
              <ul className="divide-y">
                {grouped[cls].map((s) => (
                  <li key={s.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {initials(s.name)}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {s.name}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

/* -------- Attendance (session picker) -------- */
function AttendancePanel({
  activity,
  canEdit,
  campusCode,
  sessionsHook,
}: {
  activity: InvolvedCcaActivity;
  canEdit: boolean;
  campusCode: string | null;
  sessionsHook: ReturnType<typeof useCcaSessions>;
}) {
  const { sessions, loading } = sessionsHook;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const active = useMemo(() => sessions.filter((s) => !s.isCancelled), [sessions]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const pastSessions = useMemo(
    () => active.filter((s) => s.sessionDate && s.sessionDate <= todayStr),
    [active, todayStr],
  );
  const upcomingSessions = useMemo(
    () => active.filter((s) => s.sessionDate && s.sessionDate > todayStr),
    [active, todayStr],
  );

  const selected = active.find((s) => s.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }
  if (active.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
        No sessions to take attendance for.
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedId(null)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to sessions
        </Button>
        <div className="rounded-xl border bg-card p-3 shadow-sm">
          <p className="text-sm font-medium">
            {sessionHeading(selected, activity.name)}
          </p>
          {formatTime(selected.startTime, selected.endTime) && (
            <p className="text-xs text-muted-foreground">
              {formatTime(selected.startTime, selected.endTime)}
            </p>
          )}
        </div>
        <SessionAttendanceList
          sessionId={selected.id}
          activityId={activity.id}
          activityKind={activity.kind ?? null}
          classesInvolved={activity.classesInvolved || []}
          campusCode={campusCode}
          canEdit={canEdit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Tap a session to take attendance
      </p>
      {pastSessions.length > 0 && (
        <section className="space-y-2">
          {[...pastSessions].reverse().map((s) => (
            <SessionPickerRow
              key={s.id}
              session={s}
              activityName={activity.name}
              onClick={() => setSelectedId(s.id)}
              tone="past"
            />
          ))}
        </section>
      )}
      {upcomingSessions.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-1">
            Upcoming
          </p>
          {upcomingSessions.map((s) => (
            <SessionPickerRow
              key={s.id}
              session={s}
              activityName={activity.name}
              onClick={() => setSelectedId(s.id)}
              tone="upcoming"
            />
          ))}
        </section>
      )}
    </div>
  );
}

/** Compact session row used in the AttendancePanel session list. */
function SessionPickerRow({
  session: s,
  activityName,
  onClick,
  tone,
}: {
  session: CcaSession;
  activityName: string;
  onClick: () => void;
  tone: "past" | "upcoming";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition",
        tone === "upcoming" && "opacity-80",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {sessionHeading(s, activityName)}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-0.5">
            {formatTime(s.startTime, s.endTime) && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(s.startTime, s.endTime)}
              </span>
            )}
            {s.locationName && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {s.locationName}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </button>
  );
}

/* -------- Venue -------- */
function VenuePanel({ activity }: { activity: InvolvedCcaActivity }) {
  const venue = activity.venue;
  if (!venue && !activity.location) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
        No venue assigned yet.
      </div>
    );
  }
  return (
    <Card className="rounded-xl overflow-hidden">
      {venue?.imageUrl ? (
        <img
          src={venue.imageUrl}
          alt={venue.name}
          className="w-full h-44 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-32 bg-muted flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">
            {venue?.name || activity.location || "Venue"}
          </h3>
        </div>
        {activity.location && venue?.name && venue.name !== activity.location && (
          <p className="text-xs text-muted-foreground">{activity.location}</p>
        )}
      </CardContent>
    </Card>
  );
}

