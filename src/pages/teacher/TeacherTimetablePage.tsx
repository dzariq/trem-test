import { useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, FileX } from "lucide-react";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";
import { useCampus } from "@/contexts/CampusContext";
import { useSchoolDocument } from "@/hooks/useSchoolDocument";

export default function TeacherTimetablePage() {
  const [pdfOpen, setPdfOpen] = useState(false);
  const { activeCampus } = useCampus();
  const { data: doc, isLoading } = useSchoolDocument({
    docType: "teacher_timetable",
    campusCode: activeCampus,
  });

  const title = doc?.title ?? "Teacher Timetable";
  const fileName = doc ? `${doc.title.replace(/\s+/g, "_")}.pdf` : "Teacher_Timetable.pdf";

  return (
    <TeacherAppLayout>
      <AppHeader title="My Timetable" showBack />

      <section className="px-4 pt-6 pb-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {isLoading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : doc ? (
              <FileText className="h-10 w-10 text-primary" />
            ) : (
              <FileX className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading timetable…</p>
          ) : doc ? (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
                {doc.description ?? "View your complete weekly teaching schedule with class assignments and timings."}
              </p>
              {doc.academicYear != null && (
                <p className="text-xs text-muted-foreground mb-3">Academic year {doc.academicYear}</p>
              )}
              <Button onClick={() => setPdfOpen(true)} className="gap-2">
                <FileText className="h-4 w-4" />
                View Timetable
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-2">No timetable available</h2>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Your timetable hasn't been uploaded yet. Please check back later.
              </p>
            </>
          )}
        </div>
      </section>

      {doc && (
        <PDFViewerDialog
          open={pdfOpen}
          onOpenChange={setPdfOpen}
          pdfUrl={doc.signedUrl}
          title={title}
          downloadFileName={fileName}
        />
      )}
    </TeacherAppLayout>
  );
}
