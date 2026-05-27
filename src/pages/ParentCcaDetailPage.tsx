import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Image as ImageIcon,
  MapPin,
  Users as UsersIcon,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { useCcaActivityById } from "@/hooks/useCcaActivityById";
import { useCcaSessions } from "@/hooks/useCcaSessions";
import { useStudentCcaEnrollments } from "@/hooks/useStudentCcaEnrollments";
import { useStudentSelection } from "@/contexts/StudentSelectionContext";
import { buildChildColorMap, getChildColor } from "@/lib/childColors";

import { CcaActivityImage } from "@/components/cca/CcaActivityImage";
import {
  getCcaBucket,
  getCcaBucketIcon,
  getCcaTypePillColor,
} from "@/components/cca/CcaTypeTabs";
import { CCA_BUCKET_LABEL } from "@/lib/ccaSessionFormat";
import { OverviewPanel, SchedulePanel } from "@/pages/teacher/TeacherCcaDetailPage";
import { ParentAttendancePanel } from "@/components/cca/ParentAttendancePanel";
import type { InvolvedCcaActivity } from "@/hooks/useTeacherInvolvedCcas";

type TabId = "overview" | "schedule" | "attendance" | "venue";

function DetailHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border safe-pt">
      <div className="w-full flex items-center gap-2 px-2 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold text-foreground truncate">
          {title}
        </h1>
      </div>
    </header>
  );
}

function ParentVenuePanel({ activity }: { activity: InvolvedCcaActivity }) {
  const [imgFailed, setImgFailed] = useState(false);
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
      {venue?.imageUrl && !imgFailed ? (
        <img
          src={venue.imageUrl}
          alt={venue.name}
          className="w-full h-44 object-cover"
          loading="lazy"
          onError={() => setImgFailed(true)}
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

export default function ParentCcaDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { linkedStudents, selectedStudentId, selectedStudent } = useStudentSelection();

  // Fetch enrollments across ALL linked children so the detail view works
  // regardless of which child is "selected" in the global header. The card
  // the user tapped may belong to a sibling, not the active child.
  const linkedIds = useMemo(
    () => linkedStudents.map((s) => s.id),
    [linkedStudents],
  );
  const { enrollments, loading: enrollmentsLoading } = useStudentCcaEnrollments({
    studentId: linkedIds.length > 0 ? linkedIds : null,
  });

  const enrollmentForActivity = useMemo(
    () => enrollments.find((e) => e.activityId === activityId) ?? null,
    [enrollments, activityId],
  );
  const enrolledChildren = enrollmentForActivity?.enrolledStudents ?? [];
  const isEnrolled = enrolledChildren.length > 0;

  // Which child's attendance to show. Prefer the globally selected child if
  // they are actually enrolled; otherwise fall back to the first enrolled
  // sibling. Parent can switch with the chips below when multiple are enrolled.
  const [attendanceChildId, setAttendanceChildId] = useState<string | null>(null);
  useEffect(() => {
    if (enrolledChildren.length === 0) {
      setAttendanceChildId(null);
      return;
    }
    setAttendanceChildId((prev) => {
      if (prev && enrolledChildren.some((c) => c.id === prev)) return prev;
      if (selectedStudentId && enrolledChildren.some((c) => c.id === selectedStudentId)) {
        return selectedStudentId;
      }
      return enrolledChildren[0].id;
    });
  }, [enrolledChildren, selectedStudentId]);

  const activeAttendanceChild =
    enrolledChildren.find((c) => c.id === attendanceChildId) ?? null;
  const childColorMap = useMemo(
    () => buildChildColorMap(linkedStudents),
    [linkedStudents],
  );

  const { activity, status, refetch } = useCcaActivityById(activityId ?? null);
  const sessionsHook = useCcaSessions({ activityId: activityId ?? "" });
  const { fetchSessions } = sessionsHook;

  useEffect(() => {
    if (activityId) fetchSessions();
  }, [activityId, fetchSessions]);

  const [tab, setTab] = useState<TabId>("overview");
  const [imageOpen, setImageOpen] = useState(false);

  const tabBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tabBarRef.current?.querySelector<HTMLButtonElement>(
      `[data-tab-id="${tab}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [tab]);

  const displayImageUrl =
    activity?.imageUrl || activity?.venue?.imageUrl || null;

  if (status === "loading" && !activity) {
    return (
      <AppLayout>
        <DetailHeader onBack={() => navigate("/parent/cca")} title="Loading…" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </AppLayout>
    );
  }

  if (status === "error" && !activity) {
    return (
      <AppLayout>
        <DetailHeader
          onBack={() => navigate("/parent/cca")}
          title="Couldn't load"
        />
        <div className="p-6 text-center text-sm text-muted-foreground space-y-3">
          <p>We couldn't load this CCA. Check your connection and try again.</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
            <Button onClick={() => navigate("/parent/cca")}>Back to My CCAs</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!activity) {
    return (
      <AppLayout>
        <DetailHeader onBack={() => navigate("/parent/cca")} title="Not found" />
        <div className="p-6 text-center text-sm text-muted-foreground">
          <p>This CCA isn't available.</p>
          <Button className="mt-4" onClick={() => navigate("/parent/cca")}>
            Back to My CCAs
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (
    linkedIds.length > 0 &&
    !enrollmentsLoading &&
    !isEnrolled
  ) {
    const childrenLabel =
      linkedStudents.length > 1
        ? "None of your children are"
        : `${selectedStudent?.name || linkedStudents[0]?.name || "This child"} isn't`;
    return (
      <AppLayout>
        <DetailHeader onBack={() => navigate("/parent/cca")} title={activity.name} />
        <div className="p-6 text-center text-sm text-muted-foreground">
          <p>
            {childrenLabel} enrolled in{" "}
            <span className="font-medium text-foreground">{activity.name}</span>.
          </p>
          <Button className="mt-4" onClick={() => navigate("/parent/cca")}>
            Back to My CCAs
          </Button>
        </div>
      </AppLayout>
    );
  }

  const bucket = getCcaBucket(activity.kind ?? activity.category);
  const BucketIcon = getCcaBucketIcon(bucket);
  const bucketLabel = CCA_BUCKET_LABEL[bucket];
  const bucketPill = getCcaTypePillColor(activity.kind ?? activity.category);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Schedule" },
    { id: "attendance", label: "Attendance" },
    { id: "venue", label: "Venue" },
  ];

  return (
    <AppLayout>
      <DetailHeader onBack={() => navigate("/parent/cca")} title={activity.name} />

      <div className="px-4 pt-3">
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

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">{activity.name}</h1>
          {isEnrolled && (
            <Badge variant="secondary" className="text-[10px]">
              Enrolled
            </Badge>
          )}
          <Badge
            className={cn(bucketPill, "border gap-1 text-xs")}
            variant="outline"
          >
            <BucketIcon className="h-3 w-3" />
            {bucketLabel}
          </Badge>
        </div>
        {enrolledChildren.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {enrolledChildren.map((child) => {
              const color = getChildColor(child.id, childColorMap);
              const firstName = child.name.split(" ")[0];
              return (
                <Badge
                  key={child.id}
                  variant="outline"
                  className={cn("gap-1 text-[10px] border w-fit", color.badge)}
                >
                  <UsersIcon className="h-3 w-3" />
                  {firstName}
                </Badge>
              );
            })}
          </div>
        )}
        {activity.typeName && activity.typeName !== bucketLabel && (
          <p className="text-xs text-muted-foreground mt-1">{activity.typeName}</p>
        )}
      </div>

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
                onClick={() => setTab(t.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-all",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background/95 to-transparent" />
      </div>

      <div className="px-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {tab === "overview" && <OverviewPanel activity={activity} />}
        {tab === "schedule" && (
          <SchedulePanel
            activity={activity}
            canEdit={false}
            sessionsHook={sessionsHook}
          />
        )}
        {tab === "attendance" && (
          <>
            {enrolledChildren.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {enrolledChildren.map((child) => {
                  const color = getChildColor(child.id, childColorMap);
                  const active = child.id === attendanceChildId;
                  const firstName = child.name.split(" ")[0];
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setAttendanceChildId(child.id)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition",
                        active
                          ? cn(color.badge, "ring-2 ring-offset-1 ring-primary/40")
                          : "bg-card text-muted-foreground border-border hover:text-foreground",
                      )}
                    >
                      {firstName}
                    </button>
                  );
                })}
              </div>
            )}
            <ParentAttendancePanel
              activityId={activity.id}
              studentId={activeAttendanceChild?.id ?? null}
              studentName={activeAttendanceChild?.name ?? null}
            />
          </>
        )}
        {tab === "venue" && <ParentVenuePanel activity={activity} />}
      </div>

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
    </AppLayout>
  );
}