import { CalendarDays, MapPin, User, ClipboardList, FileText, Settings } from "lucide-react";
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
import { getCcaTypeColor } from "@/components/cca/CcaTypeTabs";
import type { CcaActivity } from "@/hooks/useCcaActivities";

interface CcaDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: CcaActivity | null;
  isPIC?: boolean;
  onManageSessions?: () => void;
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
}: CcaDetailsSheetProps) {
  const getCcaCategoryColor = getCcaTypeColor;

  // Shared content for both mobile and desktop
  const sheetContent = activity ? (
    <>
      <p className="text-sm text-muted-foreground">
        {activity.publicDescription || "Details to be announced"}
      </p>

      <Card className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
        <CardContent className="p-4 space-y-3">
          {(activity.meetingDay || activity.meetingTime) && (
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

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">PIC (Person in Charge)</p>
              <PICTeachersList
                teachers={activity.picTeachers}
                fallbackCoordinator={activity.coordinatorName}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {activity.sessions.length > 0 && activity.sessions[0].requirements && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Requirements</span>
          </div>
          <p className="text-sm text-muted-foreground pl-6">
            {activity.sessions[0].requirements}
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
        {isPIC ? (
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
  ) : null;

  // Header/title content
  const titleContent = activity ? (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-lg font-semibold">{activity.name}</span>
      {isPIC && (
        <Badge variant="default" className="text-xs">
          PIC
        </Badge>
      )}
      <Badge className={getCcaCategoryColor(activity.category)} variant="secondary">
        {activity.category}
      </Badge>
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
