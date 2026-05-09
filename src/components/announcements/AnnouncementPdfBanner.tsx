import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";
import type { AnnouncementAttachment } from "@/data/announcements";

interface Props {
  attachments: AnnouncementAttachment[];
  className?: string;
}

export const isPdfAttachment = (a: AnnouncementAttachment): boolean => {
  if (a.file_type && /pdf/i.test(a.file_type)) return true;
  return /\.pdf(\?|$)/i.test(a.url ?? "") || /\.pdf$/i.test(a.name ?? "");
};

export function AnnouncementPdfBanner({ attachments, className }: Props) {
  const [pdfDialog, setPdfDialog] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: "",
    title: "",
  });

  const pdfs = (attachments ?? []).filter(isPdfAttachment);
  if (pdfs.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-attachment-border bg-attachment/70 px-3 py-3",
          className,
        )}
      >
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-normal text-attachment-foreground">
          <FileText className="h-3.5 w-3.5" />
          PDF Attachments
        </div>
        <div className="flex flex-wrap gap-2">
          {pdfs.map((pdf, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() =>
                setPdfDialog({
                  open: true,
                  url: pdf.url,
                  title: pdf.name.replace(/\.pdf$/i, ""),
                })
              }
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-attachment-border hover:bg-background transition-colors text-xs font-medium text-foreground max-w-full"
              title={pdf.name}
            >
              <FileText className="h-3.5 w-3.5 text-attachment-foreground flex-shrink-0" />
              <span className="truncate max-w-[180px]">{pdf.name}</span>
              <Download className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
      <PDFViewerDialog
        open={pdfDialog.open}
        onOpenChange={(open) => setPdfDialog((p) => ({ ...p, open }))}
        pdfUrl={pdfDialog.url}
        title={pdfDialog.title}
        downloadFileName={`${pdfDialog.title}.pdf`}
      />
    </>
  );
}
