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
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    };
    checkMobile();
  }, []);

  const getAbsoluteUrl = useCallback(() => {
    // If already absolute, return as-is
    if (pdfUrl.startsWith("http")) return pdfUrl;
    return window.location.origin + pdfUrl;
  }, [pdfUrl]);

  const handleOpenInBrowser = useCallback(async () => {
    const url = getAbsoluteUrl();
    if (isNative) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url });
      } catch {
        window.open(url, "_blank");
      }
    } else {
      window.open(url, "_blank");
    }
  }, [getAbsoluteUrl, isNative]);

  const handleDownload = useCallback(async () => {
    const url = getAbsoluteUrl();

    if (isNative) {
      // On native, open in system browser which handles download/viewing
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url });
        toast.success(`Opening ${title}...`);
      } catch {
        window.open(url, "_blank");
      }
      return;
    }

    // Web: use anchor tag download
    try {
      const link = document.createElement("a");
      link.href = pdfUrl; // use relative URL for same-origin download
      link.download = downloadFileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${title}...`);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  }, [getAbsoluteUrl, isNative, pdfUrl, downloadFileName, title]);

  // For mobile web (not native), use Google Docs viewer as fallback
  // For desktop, embed directly
  const getViewerUrl = () => {
    if (isMobile && !isNative) {
      const fullUrl = getAbsoluteUrl();
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fullUrl)}`;
    }
    return `${pdfUrl}#toolbar=0&navpanes=0`;
  };

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
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            {(isMobile || isNative) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInBrowser}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted/30">
          {isNative ? (
            // Native: show a prompt to open externally since webview can't render PDFs
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                PDF preview is not supported in the app viewer. Tap below to open
                in your device's PDF viewer.
              </p>
              <Button onClick={handleOpenInBrowser} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open {title}
              </Button>
            </div>
          ) : (
            <iframe
              src={getViewerUrl()}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
