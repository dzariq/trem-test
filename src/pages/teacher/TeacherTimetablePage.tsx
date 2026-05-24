import { useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";
import { useCampus } from "@/contexts/CampusContext";
import { useSchoolDocument } from "@/hooks/useSchoolDocument";

const FALLBACK_PDF_URL = "/documents/teacher-timetable.pdf";

export default function TeacherTimetablePage() {
  const [pdfOpen, setPdfOpen] = useState(false);
  const { activeCampus } = useCampus();
  const { data: doc, isLoading } = useSchoolDocument({
    docType: "teacher_timetable",
    campusCode: activeCampus,
  });

  const pdfUrl = doc?.signedUrl ?? FALLBACK_PDF_URL;
  const title = doc?.title ?? "Teacher Timetable";
  const fileName = doc
    ? `${doc.title.replace(/\s+/g, "_")}.pdf`
    : "Teacher_Timetable_2026.pdf";

  return (
    <TeacherAppLayout>
      <AppHeader title="My Timetable" showBack />

      <section className="px-4 pt-6 pb-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {isLoading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <FileText className="h-10 w-10 text-primary" />
            )}
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
            {doc?.description ?? "View your complete weekly teaching schedule with class assignments and timings."}
          </p>
          {doc?.academicYear != null && (
            <p className="text-xs text-muted-foreground mb-3">Academic year {doc.academicYear}</p>
          )}
          <Button onClick={() => setPdfOpen(true)} className="gap-2" disabled={isLoading}>
            <FileText className="h-4 w-4" />
            View Timetable
          </Button>
        </div>
      </section>

      <PDFViewerDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        pdfUrl={pdfUrl}
        title={title}
        downloadFileName={fileName}
      />
    </TeacherAppLayout>
  );
}
