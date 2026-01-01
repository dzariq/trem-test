import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Phone, 
  Trophy,
  Star 
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickLinks = [
  { icon: FileText, label: "Report Card", path: "/academic", bgColor: "bg-primary/10", iconColor: "text-primary" },
  { icon: Phone, label: "Contact Us", path: "#", bgColor: "bg-chart-2/10", iconColor: "text-chart-2" },
  { icon: Trophy, label: "CCA Activities", path: "#", bgColor: "bg-chart-3/10", iconColor: "text-chart-3" },
  { icon: Star, label: "Praise", path: "/support", bgColor: "bg-chart-4/10", iconColor: "text-chart-4" },
];

export function QuickLinks() {
  const navigate = useNavigate();

  return (
    <section className="px-4 py-3">
      <div className="grid grid-cols-4 gap-2">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => link.path !== "#" && navigate(link.path)}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-xl",
              "transition-all duration-200 hover:scale-105",
              "active:scale-95"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-1.5",
              link.bgColor
            )}>
              <link.icon className={cn("h-5 w-5", link.iconColor)} />
            </div>
            <span className="text-[10px] font-medium text-foreground text-center leading-tight">{link.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
