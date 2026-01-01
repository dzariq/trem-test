import { useNavigate } from "react-router-dom";
import { 
  UserCheck, 
  BarChart3, 
  Calendar,
  Heart 
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickLinks = [
  { icon: UserCheck, label: "Attendance", path: "/teacher/attendance", bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
  { icon: BarChart3, label: "Class Analysis", path: "/teacher/academic", bgColor: "bg-blue-100", iconColor: "text-blue-600" },
  { icon: Calendar, label: "Calendar", path: "/teacher/calendar", bgColor: "bg-amber-100", iconColor: "text-amber-600" },
  { icon: Heart, label: "DNA", path: "/teacher/dna", bgColor: "bg-rose-100", iconColor: "text-rose-600" },
];

export function TeacherQuickLinks() {
  const navigate = useNavigate();

  return (
    <section className="px-4 -mt-6 relative z-10">
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl px-3 py-2.5 shadow-md border border-border">
        <div className="grid grid-cols-4 gap-0.5">
          {quickLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => link.path !== "#" && navigate(link.path)}
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
  );
}
