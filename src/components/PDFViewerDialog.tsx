import { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, Maximize2, Minimize2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

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
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewerWidth, setViewerWidth] = useState(320);
  const [loadError, setLoadError] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  }, []);

  useEffect(() => {
    if (!open) return;
    setPageNumber(1);
    setNumPages(0);
    setLoadError(false);
  }, [open, pdfUrl]);

  useEffect(() => {
    const node = viewerRef.current;
    if (!open || !node) return;
    const updateWidth = () => setViewerWidth(Math.max(280, Math.min(node.clientWidth - 24, 920)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, isFullscreen]);


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

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className={`${isFullscreen ? "h-[95vh]" : "h-[82vh]"} flex flex-col p-0 gap-0`}
      >
        <DialogHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between gap-3 space-y-0 bg-background">
          <DialogTitle className="text-base font-semibold leading-tight line-clamp-2 text-left min-w-0 flex-1">{title}</DialogTitle>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isNative && !isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleOpenInBrowser} className="gap-2 px-3">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden min-[420px]:inline">Open</span>
            </Button>
            <Button variant="default" size="sm" onClick={handleDownload} className="gap-2 px-3">
              <Download className="h-4 w-4" />
              <span className="hidden min-[420px]:inline">Download</span>
            </Button>
            <Button variant="destructive" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div ref={viewerRef} className="flex-1 overflow-auto bg-muted/30 px-3 py-4">
          {!loadError ? (
            <Document
              file={resolvedPdfUrl}
              loading={<p className="py-12 text-center text-sm text-muted-foreground">Loading PDF…</p>}
              error={null}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setLoadError(false);
              }}
              onLoadError={() => setLoadError(true)}
              className="flex flex-col items-center"
            >
              <Page
                pageNumber={pageNumber}
                width={viewerWidth}
                renderAnnotationLayer
                renderTextLayer
                className="overflow-hidden rounded-lg bg-background shadow-sm"
              />
            </Document>
          ) : (
            <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                This PDF could not be previewed inline.
              </p>
              <Button onClick={handleOpenInBrowser} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open PDF in New Tab
              </Button>
              <Button variant="outline" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </div>

        {numPages > 1 && !loadError && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-background px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 rounded-full"
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {pageNumber} / {numPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 rounded-full"
              onClick={() => setPageNumber((page) => Math.min(numPages, page + 1))}
              disabled={pageNumber >= numPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}