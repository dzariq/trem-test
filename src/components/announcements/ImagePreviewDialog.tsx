import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      className="fixed inset-0 z-[100] flex flex-col bg-foreground/90 pt-[calc(0.75rem+var(--safe-top))] pb-[calc(0.75rem+var(--safe-bottom))] px-3 animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-end gap-2 pb-3">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-background/90 text-foreground hover:bg-background"
          onClick={() => window.open(src, "_blank", "noopener,noreferrer")}
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
      <button
        type="button"
        className="flex-1 min-h-0"
        onClick={() => onOpenChange(false)}
        aria-label="Close image preview"
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain"
        />
      </button>
    </div>
  );
}