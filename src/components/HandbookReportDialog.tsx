import { useRef, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, X, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import schoolBadgeSrc from "@/assets/school-badge.webp";
import { Capacitor } from "@capacitor/core";

interface HandbookSection {
  title: string;
  items: { heading: string; points: string[] }[];
}

interface HandbookReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  sections: HandbookSection[];
  downloadFileName: string;
  /** Optional map of section index → image src for preview */
  sectionImages?: Record<number, string>;
  /** Optional original PDF URL for direct download (e.g. "/documents/teacher-handbook.pdf") */
  originalPdfUrl?: string;
}

export function HandbookReportDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  sections,
  downloadFileName,
  sectionImages,
  originalPdfUrl,
}: HandbookReportDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>(schoolBadgeSrc);
  const [imageBase64Map, setImageBase64Map] = useState<Record<number, string>>({});
  const isNative = Capacitor.isNativePlatform();

  // Convert school badge to base64 data URL for reliable html2canvas capture
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setLogoBase64(canvas.toDataURL("image/png"));
        }
      } catch { /* fallback */ }
    };
    img.src = schoolBadgeSrc;
  }, []);

  // Convert section images to base64
  useEffect(() => {
    if (!sectionImages) return;
    const entries = Object.entries(sectionImages);
    entries.forEach(([idxStr, src]) => {
      const idx = Number(idxStr);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            setImageBase64Map(prev => ({ ...prev, [idx]: canvas.toDataURL("image/png") }));
          }
        } catch { /* fallback */ }
      };
      img.src = src;
    });
  }, [sectionImages]);

  // Download original PDF file directly
  const handleDownloadOriginal = useCallback(async () => {
    if (!originalPdfUrl) return;
    const resolvedUrl = originalPdfUrl.startsWith("http")
      ? originalPdfUrl
      : window.location.origin + originalPdfUrl;

    if (isNative) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: resolvedUrl });
        toast.success(`Opening ${title}...`);
      } catch {
        window.open(resolvedUrl, "_blank");
      }
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = resolvedUrl;
      link.download = downloadFileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${title}...`);
    } catch {
      window.open(resolvedUrl, "_blank");
    }
  }, [originalPdfUrl, isNative, downloadFileName, title]);

  // Generate PDF from HTML content (fallback if no original PDF)
  const handleExportPdf = useCallback(async () => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const { exportElementToPdf } = await import("@/lib/pdf/exportToPdf");
      const result = await exportElementToPdf({
        element: contentRef.current,
        filename: downloadFileName,
        marginMm: 6,
        pdfContentScale: 0.85,
      });
      if (!result.success) {
        toast.error("PDF export failed. Please try again.");
      } else if (result.savedToDevice) {
        toast.success("Saved to Downloads");
      }
    } catch {
      toast.error("PDF export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, downloadFileName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="w-[95vw] max-w-3xl h-[90vh] rounded-2xl overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between space-y-0 bg-background">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            {originalPdfUrl && (
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={handleDownloadOriginal}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
            {!originalPdfUrl && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportPdf}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {isExporting ? "Generating..." : "PDF"}
              </Button>
            )}
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

        <div className="flex-1 overflow-y-auto">
          <div ref={contentRef} style={{ background: "#ffffff", color: "#111", padding: "16px", fontFamily: "sans-serif" }}>
            {/* Report Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", paddingBottom: "10px", borderBottom: "2px solid #3b82f6" }}>
              <img src={logoBase64} alt="School Logo" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "16px" }}>{title}</div>
                {subtitle && <div style={{ fontSize: "11px", color: "#666" }}>{subtitle}</div>}
              </div>
            </div>

            {/* Sections */}
            {sections.map((section, sIdx) => (
              <div key={sIdx} style={{ marginBottom: "14px" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px", padding: "4px 8px", background: "#f1f5f9", borderRadius: "4px" }}>
                  {section.title}
                </div>
                {/* Section image */}
                {(imageBase64Map[sIdx] || sectionImages?.[sIdx]) && (
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                    <img
                      src={imageBase64Map[sIdx] || sectionImages![sIdx]}
                      alt={section.title}
                      style={{ height: "80px", objectFit: "contain", borderRadius: "6px" }}
                    />
                  </div>
                )}
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} style={{ marginBottom: "8px", paddingLeft: "8px" }}>
                    <div style={{ fontWeight: 600, fontSize: "12px", marginBottom: "3px" }}>
                      {item.heading}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "16px" }}>
                      {item.points.map((point, pIdx) => (
                        <li key={pIdx} style={{ fontSize: "11px", color: "#444", lineHeight: "1.5", marginBottom: "1px" }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}

            {/* Footer */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "16px", fontSize: "10px", color: "#999", textAlign: "center" }}>
              Generated on {new Date().toLocaleDateString()} • Collinz International School
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
