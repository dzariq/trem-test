import { useState } from "react";
import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";

const PDF_URL = "/documents/teacher-timetable.pdf";

export default function TeacherTimetablePage() {
  const [pdfOpen, setPdfOpen] = useState(false);

  return (
    <TeacherAppLayout>
      <AppHeader title="My Timetable" showBack />

      <section className="px-4 pt-6 pb-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Teacher Timetable</h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
            View your complete weekly teaching schedule with class assignments and timings.
          </p>
          <Button onClick={() => setPdfOpen(true)} className="gap-2">
            <FileText className="h-4 w-4" />
            View Timetable
          </Button>
        </div>
      </section>

      <PDFViewerDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        pdfUrl={PDF_URL}
        title="Teacher Timetable"
        downloadFileName="Teacher_Timetable_2026.pdf"
      />
    </TeacherAppLayout>
  );
}
