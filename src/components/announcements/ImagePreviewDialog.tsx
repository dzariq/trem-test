import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openExternal } from "@/lib/native/openExternal";

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string | null;
  alt: string;
}

export function ImagePreviewDialog({ open, onOpenChange, src, alt }: ImagePreviewDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open || !src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="absolute right-3 z-10 flex items-center gap-2"
        style={{ top: "calc(0.75rem + var(--safe-top))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-background/90 text-foreground hover:bg-background"
          onClick={() => void openExternal(src)}
          aria-label="Open image"
        >
          <ExternalLink className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-background/90 text-foreground hover:bg-background"
          onClick={() => onOpenChange(false)}
          aria-label="Close image preview"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}