import { useState } from "react";
import { CalendarDays, MapPin, User, ClipboardList, FileText, Settings, Users as UsersIcon, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PICTeachersList } from "@/components/cca/PICTeacherPill";
import { getCcaBucket, getCcaBucketIcon, getCcaTypePillColor } from "@/components/cca/CcaTypeTabs";
import {
  CCA_BUCKET_LABEL,
  formatSessionDateShort,
  formatSessionTimeRange,
  getUpcomingSessions,
  getNextUpcomingSession,
} from "@/lib/ccaSessionFormat";
import { cn } from "@/lib/utils";
import { CcaActivityImage } from "@/components/cca/CcaActivityImage";
import { CcaImageUpload } from "@/components/cca/CcaImageUpload";
import type { CcaActivity } from "@/hooks/useCcaActivities";
import { useCcaActivityPermissions } from "@/hooks/useCcaActivityPermissions";

interface CcaDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: CcaActivity | null;
  isPIC?: boolean;
  onManageSessions?: () => void;
  onActivityUpdated?: () => void;
}

/**
 * Responsive CCA Details Sheet/Modal.
 * - On mobile (<640px): Renders as a bottom sheet (swipeable drawer)
 * - On desktop (>=640px): Renders as a centered dialog modal
 *
 * Uses a single BottomSheet component with CSS-based responsive positioning
 * to avoid React reconciliation issues from conditional component rendering.
 */
export function CcaDetailsSheet({
  open,
  onOpenChange,
  activity,
  isPIC = false,
  onManageSessions,
  onActivityUpdated,
}: CcaDetailsSheetProps) {
  const [localImageUrl, setLocalImageUrl] = useState<string | null | undefined>(undefined);

  // Unified permission model. `isPIC` prop is still accepted for backward
  // compatibility but `canEdit` (principal OR activity PIC) is the source
  // of truth for editable surfaces.
  const perms = useCcaActivityPermissions(activity);
  const canEdit = perms.canEdit || isPIC;

  // Use local state if updated, otherwise use activity's image
  const displayImageUrl = localImageUrl !== undefined ? localImageUrl : activity?.imageUrl;

  const bucket = activity ? getCcaBucket(activity.kind ?? activity.category) : "clubs";
  const BucketIcon = getCcaBucketIcon(bucket);
  const bucketLabel = CCA_BUCKET_LABEL[bucket];
  const bucketPill = activity ? getCcaTypePillColor(activity.kind ?? activity.category) : "";
  const isEvent = bucket === "events";
  const upcomingSessions = activity ? getUpcomingSessions(activity.sessions, 3) : [];
  const nextSession = activity ? getNextUpcomingSession(activity.sessions) : null;
  const requirementsText = nextSession?.requirements || activity?.sessions?.[0]?.requirements || null;

  const handleImageUploadComplete = (newUrl: string | null) => {
    setLocalImageUrl(newUrl);
    onActivityUpdated?.();
  };

  // Shared content for both mobile and desktop
  const sheetContent = activity && perms.canView ? (
    <>
      {/* Hero Image - Editable for PIC teachers */}
      {canEdit ? (
        <CcaImageUpload
          activityId={activity.id}
          activityName={activity.name}
          currentImageUrl={displayImageUrl}
          category={activity.category}
          typeName={activity.typeName}
          onUploadComplete={handleImageUploadComplete}
          className="mb-4"
        />
      ) : (
        <CcaActivityImage
          imageUrl={displayImageUrl}
          activityName={activity.name}
          category={activity.category}
          typeName={activity.typeName}
          variant="details"
          className="mb-4"
        />
      )}

      <p className="text-sm text-muted-foreground">
        {activity.publicDescription || "Details to be announced"}
      </p>

      <Card className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
        <CardContent className="p-4 space-y-3">
          {!isEvent && (activity.meetingDay || activity.meetingTime) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Schedule</p>
                <p className="text-sm font-medium">
                  {activity.meetingDay || "TBD"}
                  {activity.meetingTime ? `, ${activity.meetingTime}` : ""}
                </p>
              </div>
            </div>
          )}

          {activity.location && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Venue</p>
                <p className="text-sm font-medium">{activity.location}</p>
              </div>
            </div>
          )}

          {!isEvent && activity.maxParticipants != null && activity.maxParticipants > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UsersIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="text-sm font-medium">Up to {activity.maxParticipants} spots</p>
              </div>
            </div>
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Contact</p>
                <a
                  href={`mailto:${activity.coordinatorEmail}`}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline truncate block"
                >
                  {activity.coordinatorEmail}
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
              <div
                key={s.id}
                className="rounded-lg border border-border bg-muted/30 p-2.5 text-sm"
              >
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
          <p className="text-sm text-muted-foreground pl-6">
            {requirementsText}
          </p>
        </div>
      )}

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

      <div className="pt-4 border-t">
        {canEdit ? (
          <Button onClick={onManageSessions} className="w-full">
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
      </div>
    </>
  ) : activity && !perms.canView ? (
    <div className="py-10 text-center text-sm text-muted-foreground">
      You don't have access to this activity.
    </div>
  ) : null;

  // Header/title content
  const titleContent = activity ? (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-lg font-semibold">{activity.name}</span>
      {perms.isActivityPIC && (
        <Badge variant="default" className="text-xs">
          PIC
        </Badge>
      )}
      {!perms.canEdit && perms.canView && (
        <Badge variant="secondary" className="text-[10px]">
          View only
        </Badge>
      )}
      <Badge className={cn(bucketPill, "border gap-1")} variant="outline">
        <BucketIcon className="h-3 w-3" />
        {bucketLabel}
      </Badge>
      {activity.typeName && activity.typeName !== bucketLabel && (
        <span className="text-xs text-muted-foreground">{activity.typeName}</span>
      )}
    </div>
  ) : null;

  // Single BottomSheet component with centeredOnDesktop for responsive behavior
  // This avoids conditional component rendering which caused double-click issues
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0, 0.75, 1]}
      defaultSnapPoint={0.75}
      title={titleContent}
      description="CCA details"
      bodyClassName="px-4 py-3 space-y-4"
      centeredOnDesktop
    >
      {sheetContent}
    </BottomSheet>
  );
}
