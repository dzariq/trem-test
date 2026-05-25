import { ReactNode } from "react";
import { TeacherBottomNavigation } from "./TeacherBottomNavigation";
import { useCcaPushReminders } from "@/hooks/useCcaPushReminders";

interface TeacherAppLayoutProps {
  children: ReactNode;
}

export function TeacherAppLayout({ children }: TeacherAppLayoutProps) {
  useCcaPushReminders();
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+var(--safe-bottom))] safe-px box-border overflow-x-hidden">
      <div className="max-w-lg mx-auto w-full overflow-x-hidden">
        {children}
      </div>
      <TeacherBottomNavigation />
    </div>
  );
}
