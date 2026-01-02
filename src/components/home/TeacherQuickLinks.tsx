import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CalendarClock, 
  BookOpen, 
  Calendar,
  BarChart3 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { icon: CalendarClock, label: "Timetable", path: "timetable", bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
  { icon: BookOpen, label: "Grade Entry", path: "/teacher/academic", bgColor: "bg-blue-100", iconColor: "text-blue-600" },
  { icon: Calendar, label: "Calendar", path: "/teacher/calendar", bgColor: "bg-amber-100", iconColor: "text-amber-600" },
  { icon: BarChart3, label: "Class Analysis", path: "/teacher/academic", bgColor: "bg-purple-100", iconColor: "text-purple-600" },
];

// Mock timetable data
const timetableData = [
  { day: "Monday", periods: ["5A - Math", "5B - Math", "Break", "6A - Math", "5A - Math"] },
  { day: "Tuesday", periods: ["6B - Math", "5A - Math", "Break", "5B - Math", "6A - Math"] },
  { day: "Wednesday", periods: ["5A - Math", "6A - Math", "Break", "5B - Math", "6B - Math"] },
  { day: "Thursday", periods: ["6B - Math", "5B - Math", "Break", "5A - Math", "6A - Math"] },
  { day: "Friday", periods: ["5A - Math", "5B - Math", "Break", "6B - Math", "Free"] },
];

export function TeacherQuickLinks() {
  const navigate = useNavigate();
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);

  const handleClick = (path: string) => {
    if (path === "timetable") {
      setIsTimetableOpen(true);
    } else if (path !== "#") {
      navigate(path);
    }
  };

  return (
    <>
      <section className="px-4 -mt-6 relative z-10">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-3 py-2.5 shadow-md border border-border">
          <div className="grid grid-cols-4 gap-0.5">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleClick(link.path)}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-1 rounded-xl",
                  "transition-all duration-200 hover:bg-muted/50",
                  "active:scale-95"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center mb-1",
                  link.bgColor
                )}>
                  <link.icon className={cn("h-4 w-4", link.iconColor)} />
                </div>
                <span className="text-[9px] font-medium text-foreground text-center leading-tight">{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Timetable Dialog */}
      <Dialog open={isTimetableOpen} onOpenChange={setIsTimetableOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Weekly Timetable
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {timetableData.map((day) => (
              <div key={day.day} className="p-3 rounded-xl border border-border bg-muted/30">
                <h3 className="font-semibold text-foreground mb-2">{day.day}</h3>
                <div className="grid grid-cols-5 gap-1">
                  {day.periods.map((period, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "text-[10px] p-1.5 rounded text-center font-medium",
                        period === "Break" && "bg-amber-100 text-amber-700",
                        period === "Free" && "bg-muted text-muted-foreground",
                        period !== "Break" && period !== "Free" && "bg-primary/10 text-primary"
                      )}
                    >
                      {period}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setIsTimetableOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
