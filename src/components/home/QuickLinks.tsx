import { useNavigate } from "react-router-dom";
import { 
  UserCheck, 
  FileText, 
  Calendar, 
  CreditCard, 
  Phone, 
  HeadphonesIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickLinks = [
  { icon: UserCheck, label: "Attendance", path: "/attendance", color: "bg-chart-1" },
  { icon: FileText, label: "Report Card", path: "/academic", color: "bg-chart-2" },
  { icon: Calendar, label: "Calendar", path: "/calendar", color: "bg-chart-3" },
  { icon: CreditCard, label: "Fees", path: "#", color: "bg-chart-4" },
  { icon: Phone, label: "Contact", path: "#", color: "bg-chart-5" },
  { icon: HeadphonesIcon, label: "Support", path: "/support", color: "bg-primary" },
];

export function QuickLinks() {
  const navigate = useNavigate();

  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-semibold text-foreground mb-3">Quick Links</h2>
      
      <div className="grid grid-cols-3 gap-3">
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => link.path !== "#" && navigate(link.path)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border",
              "shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30",
              "active:scale-95"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-2",
              link.color
            )}>
              <link.icon className="h-6 w-6 text-card" />
            </div>
            <span className="text-xs font-medium text-foreground">{link.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
