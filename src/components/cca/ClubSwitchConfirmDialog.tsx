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
import { Loader2 } from "lucide-react";

interface ClubSwitchConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentClubName: string | null;
  newClubName: string;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * Confirmation dialog for switching from one CCA club to another.
 * Shows a warning that the student will be removed from their current club.
 */
export function ClubSwitchConfirmDialog({
  open,
  onOpenChange,
  currentClubName,
  newClubName,
  onConfirm,
  loading = false,
}: ClubSwitchConfirmDialogProps) {
  const isJoiningNew = !currentClubName;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isJoiningNew ? "Join Club" : "Switch Club"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {isJoiningNew ? (
              <>
                Are you sure you want to join <strong>{newClubName}</strong>?
              </>
            ) : (
              <>
                This will remove you from <strong>{currentClubName}</strong> and
                enroll you into <strong>{newClubName}</strong>.
                <br />
                <br />
                <span className="text-destructive">
                  You can only be enrolled in one club at a time.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
          <AlertDialogCancel disabled={loading} className="flex-1 sm:flex-none">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isJoiningNew ? "Joining..." : "Switching..."}
              </>
            ) : isJoiningNew ? (
              "Join Club"
            ) : (
              "Switch Club"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
