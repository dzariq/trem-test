import { useEffect, useRef, useState } from "react";
import {
  FileText,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import {
  ACCEPTED_ATTACHMENT_MIME,
  useCcaActivityAttachments,
  type ActivityAttachment,
} from "@/hooks/useCcaActivityAttachments";
import { useCcaActivityNotes } from "@/hooks/useCcaActivityNotes";

interface EventNotesTabProps {
  activityId: string;
  initialBody: string | null;
  canEdit: boolean;
  onSaved?: () => void;
}

export function EventNotesTab({
  activityId,
  initialBody,
  canEdit,
  onSaved,
}: EventNotesTabProps) {
  const [body, setBody] = useState<string>(initialBody ?? "");
  const [original, setOriginal] = useState<string>(initialBody ?? "");
  useEffect(() => {
    setBody(initialBody ?? "");
    setOriginal(initialBody ?? "");
  }, [initialBody, activityId]);

  const { saving, saveNotes } = useCcaActivityNotes();
  const {
    items,
    loading,
    uploading,
    uploadFiles,
    deleteAttachment,
    openAttachment,
  } = useCcaActivityAttachments(activityId);

  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<ActivityAttachment | null>(
    null,
  );

  const dirty = body !== original;

  const handleSave = async () => {
    const ok = await saveNotes(activityId, body);
    if (ok) {
      setOriginal(body);
      onSaved?.();
    }
  };

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(files);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-5">
      {/* Body */}
      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Notes
            </h2>
          </div>
          {canEdit ? (
            <>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share what families should know about this event…"
                rows={6}
                className="resize-y"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!dirty || saving}
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save notes
                </Button>
              </div>
            </>
          ) : body.trim() ? (
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {body}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No notes yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Attachments
              </h2>
            </div>
            {canEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              hidden
              multiple
              accept={ACCEPTED_ATTACHMENT_MIME.join(",")}
              onChange={onFiles}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No files attached yet.
              {canEdit && (
                <p className="text-xs mt-1">
                  Images & PDFs, up to 10 MB each.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {items.map((it) => (
                <AttachmentTile
                  key={it.id}
                  item={it}
                  canEdit={canEdit}
                  onOpen={() => openAttachment(it)}
                  onDelete={() => setPendingDelete(it)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.fileName} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingDelete) await deleteAttachment(pendingDelete);
                setPendingDelete(null);
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

function AttachmentTile({
  item,
  canEdit,
  onOpen,
  onDelete,
}: {
  item: ActivityAttachment;
  canEdit: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative group rounded-lg overflow-hidden border bg-muted/30">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
        aria-label={`Open ${item.fileName}`}
      >
        {item.isImage && item.signedUrl ? (
          <img
            src={item.signedUrl}
            alt={item.fileName}
            className="w-full h-28 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-28 flex flex-col items-center justify-center bg-muted text-muted-foreground">
            <FileText className="h-8 w-8 mb-1 opacity-70" />
            <span className="text-[10px] uppercase tracking-wide">
              {item.isPdf ? "PDF" : "File"}
            </span>
          </div>
        )}
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-foreground truncate">
            {item.fileName}
          </p>
        </div>
      </button>
      {canEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            "absolute top-1 right-1 h-7 w-7 rounded-full",
            "bg-background/90 text-destructive shadow border border-border",
            "flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 focus:opacity-100",
            "active:opacity-100",
          )}
          aria-label={`Delete ${item.fileName}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}