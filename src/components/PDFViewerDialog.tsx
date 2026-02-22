import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title: string;
  downloadFileName: string;
}

export function PDFViewerDialog({
  open,
  onOpenChange,
  pdfUrl,
  title,
  downloadFileName,
}: PDFViewerDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, []);

  // Reset embed error when dialog opens
  useEffect(() => {
    if (open) setEmbedFailed(false);
  }, [open]);

  // Resolve to an absolute URL — never hits any Lovable API
  const resolvedPdfUrl = pdfUrl.startsWith("http")
    ? pdfUrl
    : window.location.origin + pdfUrl;

  const handleOpenInBrowser = useCallback(async () => {
    if (isNative) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: resolvedPdfUrl });
      } catch {
        window.open(resolvedPdfUrl, "_blank");
      }
    } else {
      window.open(resolvedPdfUrl, "_blank");
    }
  }, [resolvedPdfUrl, isNative]);

  const handleDownload = useCallback(async () => {
    if (isNative) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: resolvedPdfUrl });
        toast.success(`Opening ${title}...`);
      } catch {
        window.open(resolvedPdfUrl, "_blank");
      }
      return;
    }

    // Web: anchor download pointing directly at the PDF URL
    try {
      const link = document.createElement("a");
      link.href = resolvedPdfUrl;
      link.download = downloadFileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${title}...`);
    } catch {
      window.open(resolvedPdfUrl, "_blank");
    }
  }, [resolvedPdfUrl, isNative, downloadFileName, title]);

  const showEmbedViewer = !isNative && !isMobile && !embedFailed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className={`${isFullscreen ? "max-w-[95vw] h-[95vh]" : "max-w-3xl h-[80vh]"} flex flex-col p-0 gap-0`}
      >
        <DialogHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between space-y-0 bg-background">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            {!isNative && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleOpenInBrowser} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
            <Button variant="default" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="destructive" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-muted/30">
          {showEmbedViewer ? (
            <object
              data={resolvedPdfUrl}
              type="application/pdf"
              className="w-full h-full"
              onError={() => setEmbedFailed(true)}
            >
              {/* Fallback rendered inside <object> if browser can't display */}
              <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Your browser cannot display this PDF inline.
                </p>
                <Button onClick={handleOpenInBrowser} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open PDF in New Tab
                </Button>
              </div>
            </object>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Tap below to open the PDF in your viewer.
              </p>
              <Button onClick={handleOpenInBrowser} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open {title}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}