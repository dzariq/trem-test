import { useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles,
  Megaphone,
  Receipt,
  CalendarClock,
  Plane,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";

export type ParentMoreRoute = {
  to: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  description: string;
};

const ALL_ROUTES: ParentMoreRoute[] = [
  {
    to: "/parent/invoice",
    label: "Invoice",
    icon: Receipt,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    description: "Fees and payment history",
  },
  {
    to: "/parent/announcements",
    label: "Announcements",
    icon: Megaphone,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    description: "School-wide updates",
  },
  {
    to: "/parent/cca",
    label: "My Children's CCAs",
    icon: Sparkles,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    description: "Enrolled clubs and upcoming sessions",
  },
  {
    to: "/parent/timetable",
    label: "Timetable",
    icon: CalendarClock,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    description: "Weekly class schedule",
  },
  {
    to: "/parent/visa",
    label: "Visa",
    icon: Plane,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    description: "Visa records and renewals",
  },
  {
    to: "/parent/support",
    label: "Support",
    icon: Headphones,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
    description: "Contact the school",
  },
];

export function useParentMoreRoutes(): ParentMoreRoute[] {
  return ALL_ROUTES;
}

interface ParentMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParentMoreSheet({ open, onOpenChange }: ParentMoreSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const routes = useParentMoreRoutes();

  const go = (to: string) => {
    onOpenChange(false);
    if (location.pathname !== to) navigate(to);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="More"
      snapPoints={[0, 1]}
      defaultSnapPoint={1}
    >
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {routes.map((r) => {
          const Icon = r.icon;
          const active =
            location.pathname === r.to ||
            location.pathname.startsWith(r.to + "/");
          return (
            <button
              key={r.to}
              onClick={() => go(r.to)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left",
                "transition-all active:scale-[0.98]",
                active
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card hover:bg-accent/40"
              )}
            >
              <div
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center",
                  r.iconBg
                )}
              >
                <Icon className={cn("h-6 w-6", r.iconColor)} strokeWidth={2} />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">
                  {r.label}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {r.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}