import { TeacherAppLayout } from "@/components/layout/TeacherAppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const timetableData = [
  { day: "Monday", periods: ["5A - Math", "5B - Math", "Break", "6A - Math", "5A - Math"] },
  { day: "Tuesday", periods: ["6B - Math", "5A - Math", "Break", "5B - Math", "6A - Math"] },
  { day: "Wednesday", periods: ["5A - Math", "6A - Math", "Break", "5B - Math", "6B - Math"] },
  { day: "Thursday", periods: ["6B - Math", "5B - Math", "Break", "5A - Math", "6A - Math"] },
  { day: "Friday", periods: ["5A - Math", "5B - Math", "Break", "6B - Math", "Free"] },
];

const periodTimes = ["8:00-8:45", "8:50-9:35", "9:35-10:00", "10:00-10:45", "10:50-11:35"];

const PDF_URL = "/documents/teacher-timetable.pdf";

export default function TeacherTimetablePage() {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = PDF_URL;
    link.download = 'Teacher_Timetable_2026.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloading Timetable PDF...");
  };

  return (
    <TeacherAppLayout>
      <AppHeader 
        title="My Timetable" 
        showBack 
        rightContent={
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleDownload}
            className="text-foreground"
          >
            <Download className="h-5 w-5" />
          </Button>
        }
      />

      <section className="px-4 pt-4 pb-8">
        {/* Timetable Header */}
        <div className="bg-primary/10 rounded-t-xl p-3 border border-border border-b-0">
          <div className="grid grid-cols-6 gap-1 text-center">
            <div className="text-xs font-semibold text-muted-foreground">Time</div>
            {["P1", "P2", "Break", "P3", "P4"].map((period, idx) => (
              <div key={idx} className="text-xs font-semibold text-foreground">
                {period}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1 text-center mt-1">
            <div></div>
            {periodTimes.map((time, idx) => (
              <div key={idx} className="text-[8px] text-muted-foreground">
                {time}
              </div>
            ))}
          </div>
        </div>

        {/* Timetable Body */}
        <div className="bg-card rounded-b-xl border border-border overflow-hidden">
          {timetableData.map((day, dayIdx) => (
            <div 
              key={day.day}
              className={cn(
                "grid grid-cols-6 gap-1 p-2",
                dayIdx !== timetableData.length - 1 && "border-b border-border"
              )}
            >
              <div className="flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground">{day.day.slice(0, 3)}</span>
              </div>
              {day.periods.map((period, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "text-[9px] p-2 rounded-lg text-center font-medium min-h-[50px] flex items-center justify-center",
                    period === "Break" && "bg-amber-100 text-amber-700",
                    period === "Free" && "bg-muted text-muted-foreground",
                    period !== "Break" && period !== "Free" && "bg-primary/10 text-primary"
                  )}
                >
                  {period}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary/10"></div>
            <span className="text-xs text-muted-foreground">Class</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-100"></div>
            <span className="text-xs text-muted-foreground">Break</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted"></div>
            <span className="text-xs text-muted-foreground">Free Period</span>
          </div>
        </div>

        {/* Download Button */}
        <Button 
          className="w-full mt-6" 
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Timetable PDF
        </Button>
      </section>
    </TeacherAppLayout>
  );
}