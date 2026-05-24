import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";
import { useStudentSelection } from "@/contexts/StudentSelectionContext";
import { useSchoolDocument, useStudentClassYearId } from "@/hooks/useSchoolDocument";

export default function ParentTimetablePage() {
  const { selectedStudent } = useStudentSelection();
  const { data: classYearId } = useStudentClassYearId(selectedStudent?.className);
  const { data: doc, isLoading } = useSchoolDocument({
    docType: "student_timetable",
    campusCode: selectedStudent?.campus_code ?? null,
    classYearId: classYearId ?? null,
    enabled: Boolean(selectedStudent),
  });
  const [pdfOpen, setPdfOpen] = useState(false);

  return (
    <AppLayout>
      <AppHeader title="Timetable" showBack showNotifications />
      <div className="px-4 py-6 space-y-4">
        {doc && (
          <Card>
            <CardContent className="py-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground truncate">{doc.title}</h2>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.description}</p>
                  )}
                  {doc.academicYear != null && (
                    <p className="text-[11px] text-muted-foreground mt-1">Academic year {doc.academicYear}</p>
                  )}
                </div>
              </div>
              <Button onClick={() => setPdfOpen(true)} className="w-full gap-2">
                <FileText className="h-4 w-4" />
                View Timetable
              </Button>
            </CardContent>
          </Card>
        )}

        {!doc && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center py-12 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
              ) : (
                <CalendarClock className="h-7 w-7 text-emerald-600" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isLoading ? "Loading timetable…" : "Timetable coming soon"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Your child's weekly class schedule will appear here once published by the school.
              </p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {doc && (
        <PDFViewerDialog
          open={pdfOpen}
          onOpenChange={setPdfOpen}
          pdfUrl={doc.signedUrl}
          title={doc.title}
          downloadFileName={`${doc.title.replace(/\s+/g, "_")}.pdf`}
        />
      )}
    </AppLayout>
  );
}