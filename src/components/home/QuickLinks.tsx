import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Info, 
  Trophy, 
  Dumbbell,
  BarChart3,
  Award,
  BookOpen,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PDFViewerDialog } from "@/components/PDFViewerDialog";

const quickLinks = [
  { icon: Info, label: "Info", action: "info-dialog", bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
  { icon: Trophy, label: "Student Awards", path: "/parent/awards", bgColor: "bg-blue-100", iconColor: "text-blue-600" },
  { icon: Award, label: "Awards", path: "/parent/academic?tab=cocurriculum", bgColor: "bg-purple-100", iconColor: "text-purple-600" },
  { icon: Dumbbell, label: "CCA Activities", path: "/parent/calendar?tab=cca", bgColor: "bg-amber-100", iconColor: "text-amber-600" },
  { icon: BarChart3, label: "Grade Analysis", path: "/parent/academic?section=analysis", bgColor: "bg-rose-100", iconColor: "text-rose-600" },
];

export function QuickLinks() {
  const navigate = useNavigate();
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isTimetablePdfOpen, setIsTimetablePdfOpen] = useState(false);

  const handleQuickLinkClick = (link: typeof quickLinks[0]) => {
    if (link.action === "info-dialog") {
      setIsInfoDialogOpen(true);
    } else if (link.path) {
      navigate(link.path);
    }
  };

  return (
    <>
      <section className="px-4 mt-3 relative z-10">
        <div className="bg-background/20 backdrop-blur-md rounded-2xl px-3 py-2.5 shadow-lg border border-white/20">
          <div className="grid grid-cols-5 gap-0.5">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleQuickLinkClick(link)}
                className={cn(
                  "flex flex-col items-center justify-start py-1.5 px-1 rounded-xl",
                  "transition-all duration-200 hover:bg-muted/50",
                  "active:scale-95"
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                  link.bgColor
                )}>
                  <link.icon className={cn("h-6 w-6", link.iconColor)} strokeWidth={2} />
                </div>
                <span className="text-[9px] font-medium text-foreground text-center leading-tight mt-1.5 h-6 flex items-start justify-center">{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">Info</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => {
                setIsInfoDialogOpen(false);
                navigate("/parent/handbook");
              }}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-foreground">Student Handbook</span>
            </button>
            <button
              onClick={() => {
                setIsInfoDialogOpen(false);
                setIsTimetablePdfOpen(true);
              }}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="h-7 w-7 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-foreground">Student Timetable</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timetable PDF Viewer */}
      <PDFViewerDialog
        open={isTimetablePdfOpen}
        onOpenChange={setIsTimetablePdfOpen}
        pdfUrl="/documents/student-timetable.pdf"
        title="Student Timetable"
        downloadFileName="Student_Timetable_2026.pdf"
      />
    </>
  );
}
