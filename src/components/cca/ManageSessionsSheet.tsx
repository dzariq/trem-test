import { useEffect, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2, Loader2, XCircle, RotateCcw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useCcaSessions, type CcaSession, type CcaSessionFormData } from "@/hooks/useCcaSessions";
import { SessionFormDialog } from "./SessionFormDialog";
import type { CcaActivity } from "@/hooks/useCcaActivities";

interface ManageSessionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: CcaActivity;
}

/**
 * Bottom sheet for managing CCA sessions, replacing the old Dialog.
 * Uses vaul Drawer with snap points at 50%, 75% (default), and 95%.
 * Content scrolls inside the sheet body; the sheet itself drags via the handle.
 */
export function ManageSessionsSheet({
  open,
  onOpenChange,
  activity,
}: ManageSessionsSheetProps) {
  const {
    sessions,
    loading,
    saving,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    cancelSession,
  } = useCcaSessions({ activityId: activity.id });

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CcaSession | null>(null);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<CcaSession | null>(null);
  // Snap points: 50%, 75% (default open), 95% near-full
  const [snap, setSnap] = useState<number | string | null>(0.75);

  useEffect(() => {
    if (open) {
      fetchSessions();
      setSnap(0.75);
    }
  }, [open, fetchSessions]);

  const handleCreate = () => {
    setEditingSession(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (session: CcaSession) => {
    setEditingSession(session);
    setFormDialogOpen(true);
  };

  const handleSave = async (formData: CcaSessionFormData): Promise<boolean> => {
    if (editingSession) {
      return updateSession(editingSession.id, formData);
    } else {
      return createSession(formData);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmSession) {
      await deleteSession(deleteConfirmSession.id);
      setDeleteConfirmSession(null);
    }
  };

  const handleToggleCancel = async (session: CcaSession) => {
    await cancelSession(session.id, !session.isCancelled);
  };

  const formatSessionDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEE, MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatTime = (startTime: string | null, endTime: string | null) => {
    if (!startTime && !endTime) return null;
    const start = startTime || "--:--";
    const end = endTime || "--:--";
    return `${start} - ${end}`;
  };

  const activeSessions = sessions.filter((s) => !s.isCancelled);
  const cancelledSessions = sessions.filter((s) => s.isCancelled);

  return (
    <>
      <DrawerPrimitive.Root
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={[0.5, 0.75, 0.95]}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        modal={true}
      >
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <DrawerPrimitive.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[10px] border bg-background",
              "max-h-[calc(100vh-var(--safe-top))]"
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1.5 w-12 rounded-full bg-muted" />
            </div>

            {/* Header — fixed, doesn't scroll */}
            <div className="flex-shrink-0 px-4 pb-3 border-b border-border">
              <DrawerPrimitive.Title className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Manage Sessions
              </DrawerPrimitive.Title>
              <DrawerPrimitive.Description className="text-sm text-muted-foreground">
                {activity.name}
              </DrawerPrimitive.Description>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-4 pb-[var(--safe-bottom)] drawer-scroll">
              {/* Add Session Button */}
              <Button
                onClick={handleCreate}
                className="w-full"
                variant="outline"
                disabled={saving}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Empty State */}
              {!loading && sessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No sessions scheduled yet</p>
                  <p className="text-sm">Create your first session above</p>
                </div>
              )}

              {/* Active Sessions */}
              {!loading && activeSessions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Upcoming Sessions ({activeSessions.length})
                  </p>
                  {activeSessions.map((session) => (
                    <Card key={session.id} className="bg-card border-border">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {session.customTitle || formatSessionDate(session.sessionDate)}
                              </span>
                            </div>
                            {session.customTitle && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {formatSessionDate(session.sessionDate)}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {formatTime(session.startTime, session.endTime) && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(session.startTime, session.endTime)}
                                </span>
                              )}
                              {session.locationName && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {session.locationName}
                                </span>
                              )}
                            </div>
                            {session.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {session.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(session)}
                              disabled={saving}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => handleToggleCancel(session)}
                              disabled={saving}
                              title="Cancel session"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteConfirmSession(session)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Cancelled Sessions */}
              {!loading && cancelledSessions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cancelled ({cancelledSessions.length})
                  </p>
                  {cancelledSessions.map((session) => (
                    <Card key={session.id} className="bg-muted/30 border-border opacity-60">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-muted-foreground line-through">
                                {session.customTitle || formatSessionDate(session.sessionDate)}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                Cancelled
                              </Badge>
                            </div>
                            {session.customTitle && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {formatSessionDate(session.sessionDate)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => handleToggleCancel(session)}
                              disabled={saving}
                              title="Restore session"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteConfirmSession(session)}
                              disabled={saving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>

      {/* Session Form Dialog — stays as dialog since it's a focused form */}
      <SessionFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        session={editingSession}
        saving={saving}
        onSave={handleSave}
        allowFreeText={activity.allowFreeText}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmSession}
        onOpenChange={(open) => !open && setDeleteConfirmSession(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session
              {deleteConfirmSession?.customTitle
                ? ` "${deleteConfirmSession.customTitle}"`
                : deleteConfirmSession?.sessionDate
                ? ` on ${formatSessionDate(deleteConfirmSession.sessionDate)}`
                : ""}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
