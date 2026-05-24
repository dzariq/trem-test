import { useNavigate, useLocation } from "react-router-dom";
import {
  ClipboardList,
  Sparkles,
  BookMarked,
  Heart,
  CalendarClock,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";

export type MoreRoute = {
  to: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  description: string;
};

export const MORE_ROUTES: MoreRoute[] = [
  {
    to: "/teacher/announcements",
    label: "Announcements",
    icon: Megaphone,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    description: "School-wide updates",
  },
  {
    to: "/teacher/cca",
    label: "My CCAs",
    icon: Sparkles,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    description: "Clubs, outdoor and events you lead",
  },
  {
    to: "/teacher/lesson-plans",
    label: "Lesson Plans",
    icon: ClipboardList,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    description: "Plan and reflect on lessons",
  },
  {
    to: "/teacher/timetable",
    label: "Timetable",
    icon: CalendarClock,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    description: "Your weekly schedule",
  },
  {
    to: "/teacher/handbook",
    label: "Handbook",
    icon: BookMarked,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    description: "Teacher handbook",
  },
  {
    to: "/teacher/dna",
    label: "DNA",
    icon: Heart,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
    description: "Core values",
  },
];

interface TeacherMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherMoreSheet({ open, onOpenChange }: TeacherMoreSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (to: string) => {
    onOpenChange(false);
    if (location.pathname !== to) navigate(to);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="More"
      snapPoints={[0, 0.85]}
      defaultSnapPoint={0.85}
    >
      <div className="px-4 py-4 pb-8 grid grid-cols-2 gap-3">
        {MORE_ROUTES.map((r) => {
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
                <Icon
                  className={cn("h-6 w-6", r.iconColor)}
                  fill={r.icon === Heart ? "currentColor" : "none"}
                  strokeWidth={2}
                />
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