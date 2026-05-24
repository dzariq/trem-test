import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  CalendarDays,
  Clock,
  MapPin,
  Image as ImageIcon,
  FileText,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  Save,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CcaSession, CcaSessionFormData } from "@/hooks/useCcaSessions";
import {
  useCcaSessionAttachments,
  type SessionAttachment,
} from "@/hooks/useCcaSessionAttachments";
import { formatSessionTimeRange } from "@/lib/ccaSessionFormat";

interface SessionNotesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CcaSession | null;
  activityId: string;
  activityName: string;
  canEdit: boolean;
  saving: boolean;
  onSave: (sessionId: string, data: CcaSessionFormData) => Promise<boolean>;
}

function formatBytes(n: number | null) {
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(s: string) {
  try {
    return format(parseISO(s), "EEE, d MMM yyyy");
  } catch {
    return s;
  }
}

export function SessionNotesSheet({
  open,
  onOpenChange,
  session,
  activityId,
  activityName,
  canEdit,
  saving,
  onSave,
}: SessionNotesSheetProps) {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [previewImage, setPreviewImage] = useState<SessionAttachment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SessionAttachment | null>(null);

  const {
    images,
    pdfs,
    loading: attLoading,
    uploading,
    uploadFile,
    deleteAttachment,
  } = useCcaSessionAttachments(activityId, session?.id ?? null);

  // Reset form whenever a new session is opened
  useEffect(() => {
    if (!session) return;
    setTitle(session.customTitle ?? "");
    setDescription(session.description ?? "");
    setRequirements(session.requirements ?? "");
    setEditMode(false);
  }, [session?.id, open]);

  if (!session) return null;

  const dateLabel = formatDate(session.sessionDate);
  const timeLabel = formatSessionTimeRange(session.startTime, session.endTime);
  const hasTitle = !!(session.customTitle?.trim() &&
    session.customTitle.trim().toLowerCase() !== activityName.trim().toLowerCase());

  const isParentView = !canEdit;
  const hasAnyContent =
    hasTitle ||
    !!session.description?.trim() ||
    !!session.requirements?.trim() ||
    images.length > 0 ||
    pdfs.length > 0;
  const showParentEmptyState = isParentView && !attLoading && !hasAnyContent;

  const handleSave = async () => {
    const ok = await onSave(session.id, {
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
      locationId: session.locationId,
      location: session.location,
      customTitle: title.trim() || null,
      description: description.trim() || null,
      requirements: requirements.trim() || null,
    });
    if (ok) setEditMode(false);
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadFile(file, "image");
  };
  const handlePdfPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadFile(file, "pdf");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="z-[100] h-[100dvh] sm:h-[75vh] sm:max-h-[75vh] rounded-t-2xl p-0 flex flex-col gap-0"
        >
          <SheetHeader className="px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 border-b border-border text-left">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base font-semibold truncate">
                  {hasTitle ? session.customTitle : dateLabel}
                </SheetTitle>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {dateLabel}
                  </span>
                  {timeLabel && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeLabel}
                    </span>
                  )}
                  {session.locationName && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.locationName}
                    </span>
                  )}
                </div>
              </div>
              {canEdit && !editMode && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setEditMode(true)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
              {canEdit && editMode && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTitle(session.customTitle ?? "");
                      setDescription(session.description ?? "");
                      setRequirements(session.requirements ?? "");
                      setEditMode(false);
                    }}
                    disabled={saving}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Save</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
            {showParentEmptyState ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-6">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground">
                  No notes for this session yet
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                  The teacher hasn't shared any notes, requirements, or attachments for this session. Please check back later.
                </p>
              </div>
            ) : (
              <>
            {/* Title */}
            <section className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Session title
              </label>
              {editMode ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Watercolour fundamentals"
                  maxLength={120}
                />
              ) : (
                <p className="text-sm text-foreground">
                  {hasTitle ? session.customTitle : <span className="text-muted-foreground italic">No title set</span>}
                </p>
              )}
            </section>

            {/* Notes / description */}
            <section className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Session notes
              </label>
              {editMode ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Add session notes, remarks, what was covered…"
                  className="resize-none"
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {session.description?.trim() || (
                    <span className="text-muted-foreground italic">No notes yet</span>
                  )}
                </p>
              )}
            </section>

            {/* Requirements */}
            <section className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Requirements
              </label>
              {editMode ? (
                <Textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={3}
                  placeholder="What students should bring or prepare"
                  className="resize-none"
                />
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {session.requirements?.trim() || (
                    <span className="text-muted-foreground italic">None</span>
                  )}
                </p>
              )}
            </section>

            {/* Images */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Images
                  {images.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {images.length}
                    </Badge>
                  )}
                </label>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Image
                      </>
                    )}
                  </Button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePick}
                />
              </div>
              {attLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                </div>
              ) : images.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No images attached</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img)}
                        className="absolute inset-0"
                        aria-label={`Open ${img.fileName}`}
                      >
                        <img
                          src={img.url}
                          alt={img.fileName}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(img)}
                          className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 active:opacity-100 transition"
                          aria-label="Delete image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* PDFs */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> PDF attachments
                  {pdfs.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {pdfs.length}
                    </Badge>
                  )}
                </label>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        PDF
                      </>
                    )}
                  </Button>
                )}
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handlePdfPick}
                />
              </div>
              {pdfs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No PDFs attached</p>
              ) : (
                <ul className="space-y-1.5">
                  {pdfs.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card pl-3 pr-2 min-h-11"
                    >
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 py-2"
                      >
                        <p className="text-sm font-medium truncate text-foreground">
                          {p.fileName}
                        </p>
                        {p.sizeBytes != null && (
                          <p className="text-[10px] text-muted-foreground">
                            {formatBytes(p.sizeBytes)}
                          </p>
                        )}
                      </a>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="h-9 w-9 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 shrink-0"
                          aria-label="Delete PDF"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Image lightbox */}
      <Dialog open={!!previewImage} onOpenChange={(o) => !o && setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] p-0 bg-black/90 border-0 z-[110]">
          {previewImage && (
            <>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={previewImage.url}
                alt={previewImage.fileName}
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent className="z-[110]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.fileName}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget) await deleteAttachment(deleteTarget);
                setDeleteTarget(null);
              }}
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
