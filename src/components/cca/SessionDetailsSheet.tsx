import { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, Clock, MapPin, Users, FileText, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { ManageStudentsSheet } from "./ManageStudentsSheet";

interface SessionDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    activityId: string;
    activityName: string;
    sessionDate: string;
    startTime: string | null;
    endTime: string | null;
    locationName: string | null;
    customTitle: string | null;
    description: string | null;
    requirements: string | null;
    isCancelled: boolean;
    category: string;
  } | null;
  isPIC: boolean;
}

/**
 * Session details sheet with enrollment management for teachers.
 * Shows session info, enrolled student count, and "Manage Students" button for PICs.
 */
export function SessionDetailsSheet({
  open,
  onOpenChange,
  session,
  isPIC,
}: SessionDetailsSheetProps) {
  const [enrollmentInfo, setEnrollmentInfo] = useState<{
    count: number;
    max: number;
    loading: boolean;
  }>({ count: 0, max: 25, loading: true });
  const [manageStudentsOpen, setManageStudentsOpen] = useState(false);

  useEffect(() => {
    if (open && session?.id) {
      fetchEnrollmentInfo();
    }
  }, [open, session?.id]);

  const fetchEnrollmentInfo = async () => {
    if (!session?.id) return;

    setEnrollmentInfo((prev) => ({ ...prev, loading: true }));

    try {
      // Get enrollment count
      const { data: countData } = await supabase.rpc("get_session_enrollment_count", {
        p_session_id: session.id,
      });

      // Get max participants
      const { data: sessionData } = await supabase
        .from("cca_sessions")
        .select("max_participants")
        .eq("id", session.id)
        .single();

      setEnrollmentInfo({
        count: countData || 0,
        max: sessionData?.max_participants || 25,
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching enrollment info:", err);
      setEnrollmentInfo((prev) => ({ ...prev, loading: false }));
    }
  };

  const formatSessionDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE, MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatTime = (startTime: string | null, endTime: string | null) => {
    if (!startTime && !endTime) return "All Day";
    const start = startTime || "--:--";
    const end = endTime || "--:--";
    return `${start} - ${end}`;
  };

  const handleManageStudentsClose = (isOpen: boolean) => {
    if (!isOpen) {
      setManageStudentsOpen(false);
      // Refresh enrollment info when closing
      fetchEnrollmentInfo();
    }
  };

  const sessionTitle = session?.customTitle || (session ? formatSessionDate(session.sessionDate) : "");

  return (
    <>
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={[0, 0.6, 0.9]}
        defaultSnapPoint={0.6}
        title={
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Session Details</span>
            {session?.isCancelled && (
              <Badge variant="destructive" className="text-xs">
                Cancelled
              </Badge>
            )}
          </div>
        }
        description={session?.activityName || "CCA Session"}
        bodyClassName="px-4 py-3 space-y-4"
        centeredOnDesktop
      >
        {session && (
          <>
            {/* Session Title/Date */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {session.customTitle || formatSessionDate(session.sessionDate)}
              </h3>
              {session.customTitle && (
                <p className="text-sm text-muted-foreground">
                  {formatSessionDate(session.sessionDate)}
                </p>
              )}
            </div>

            {/* Session Info Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-sm font-medium">
                      {formatTime(session.startTime, session.endTime)}
                    </p>
                  </div>
                </div>

                {session.locationName && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{session.locationName}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {session.description && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Description</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">{session.description}</p>
              </div>
            )}

            {/* Requirements */}
            {session.requirements && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Requirements</span>
                </div>
                <p className="text-sm text-muted-foreground pl-6">{session.requirements}</p>
              </div>
            )}

            {/* Enrollment Section */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">Enrolled Students</span>
                </div>
                {enrollmentInfo.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Badge
                    variant={enrollmentInfo.count >= enrollmentInfo.max ? "destructive" : "secondary"}
                    className="text-base px-3 py-1"
                  >
                    {enrollmentInfo.count} / {enrollmentInfo.max}
                  </Badge>
                )}
              </div>

              {/* Manage Students Button */}
              {isPIC ? (
                <Button
                  onClick={() => setManageStudentsOpen(true)}
                  className="w-full"
                  disabled={session.isCancelled}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Students
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
                          <Users className="h-4 w-4 mr-2" />
                          Manage Students
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Only PIC teachers can manage student enrollment.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </>
        )}
      </BottomSheet>

      {/* Manage Students Sheet */}
      {session && (
        <ManageStudentsSheet
          open={manageStudentsOpen}
          onOpenChange={handleManageStudentsClose}
          sessionId={session.id}
          activityId={session.activityId}
          activityName={session.activityName}
          sessionTitle={sessionTitle}
        />
      )}
    </>
  );
}
