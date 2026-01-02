import { useNavigate } from "react-router-dom";
import { 
  BookMarked, 
  Trophy, 
  Dumbbell,
  BarChart3 
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickLinks = [
  { icon: BookMarked, label: "Handbook", path: "/parent/handbook", bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
  { icon: Trophy, label: "Student Awards", path: "/parent/awards", bgColor: "bg-blue-100", iconColor: "text-blue-600" },
  { icon: Dumbbell, label: "CCA Activities", path: "/parent/calendar?tab=cca", bgColor: "bg-amber-100", iconColor: "text-amber-600" },
  { icon: BarChart3, label: "Grade Analysis", path: "/parent/academic", bgColor: "bg-rose-100", iconColor: "text-rose-600" },
];

export function QuickLinks() {
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
