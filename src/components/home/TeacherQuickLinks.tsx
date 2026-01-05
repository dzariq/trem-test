import { useNavigate } from "react-router-dom";
import { 
  CalendarClock, 
  BookOpen, 
  BookMarked,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherQuickLinksProps {
  onTimetableClick?: () => void;
}

const quickLinks = [
  { icon: Heart, label: "DNA", path: "/teacher/dna", bgColor: "bg-rose-100", iconColor: "text-rose-500", isHeart: true },
  { icon: BookOpen, label: "Grade Entry", path: "/teacher/academic", bgColor: "bg-blue-100", iconColor: "text-blue-600" },
  { icon: BookMarked, label: "Handbook", path: "/teacher/handbook", bgColor: "bg-purple-100", iconColor: "text-purple-600" },
  { icon: CalendarClock, label: "Timetable", path: "/teacher/timetable", bgColor: "bg-emerald-100", iconColor: "text-emerald-600", action: "timetable" },
];

export function TeacherQuickLinks({ onTimetableClick }: TeacherQuickLinksProps) {
  const navigate = useNavigate();

  const handleClick = (link: typeof quickLinks[0]) => {
    if (link.action === "timetable" && onTimetableClick) {
      onTimetableClick();
    } else {
      navigate(link.path);
    }
  };

  return (
    <section className="px-4 -mt-6 relative z-10">
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-3 py-2.5 shadow-md border border-border">
        <div className="grid grid-cols-4 gap-0.5">
          {quickLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleClick(link)}
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
                {link.isHeart ? (
                  <link.icon className="h-4 w-4" fill="#ef4444" color="#ef4444" />
                ) : (
                  <link.icon className={cn("h-4 w-4", link.iconColor)} />
                )}
              </div>
              <span className="text-[9px] font-medium text-foreground text-center leading-tight">{link.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
