import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Maximize2, Minimize2, ExternalLink, Loader2 } from "lucide-react";
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
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    if (pdfUrl.startsWith("http")) return pdfUrl;
    return window.location.origin + pdfUrl;
  }, [pdfUrl]);

  // Fetch PDF as blob for reliable viewing and downloading
  useEffect(() => {
    if (!open || isNative) return;
    
    let cancelled = false;
    setIsLoading(true);
    setLoadError(false);
    setPdfBlobUrl(null);

    const fetchPdf = async () => {
      try {
        const url = getAbsoluteUrl();
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";
        // If the response isn't a PDF (e.g. HTML auth page), treat as error
        if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
          console.warn("[PDFViewer] Unexpected content-type:", contentType);
          throw new Error("Response is not a PDF");
        }

        const blob = await response.blob();
        if (cancelled) return;
        
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (err) {
        console.error("[PDFViewer] Error loading PDF:", err);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchPdf();

    return () => {
      cancelled = true;
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [open, pdfUrl, getAbsoluteUrl, isNative]);

  const handleOpenInBrowser = useCallback(async () => {
    const url = pdfBlobUrl || getAbsoluteUrl();
    if (isNative) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: getAbsoluteUrl() });
      } catch {
        window.open(getAbsoluteUrl(), "_blank");
      }
    } else {
      window.open(url, "_blank");
    }
  }, [getAbsoluteUrl, isNative, pdfBlobUrl]);

  const handleDownload = useCallback(async () => {
    if (isNative) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: getAbsoluteUrl() });
        toast.success(`Opening ${title}...`);
      } catch {
        window.open(getAbsoluteUrl(), "_blank");
      }
      return;
    }

    // Web: use blob URL for reliable download
    try {
      const urlToUse = pdfBlobUrl || getAbsoluteUrl();
      const link = document.createElement("a");
      link.href = urlToUse;
      link.download = downloadFileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${title}...`);
    } catch {
      window.open(getAbsoluteUrl(), "_blank");
    }
  }, [getAbsoluteUrl, isNative, pdfBlobUrl, downloadFileName, title]);

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
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading PDF…</p>
            </div>
          ) : loadError || !pdfBlobUrl ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Unable to preview the PDF inline. You can open it in a new tab instead.
              </p>
              <Button onClick={() => window.open(getAbsoluteUrl(), "_blank")} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          ) : (
            <iframe
              src={pdfBlobUrl}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}