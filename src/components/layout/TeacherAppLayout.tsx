import { ReactNode } from "react";
import { TeacherBottomNavigation } from "./TeacherBottomNavigation";

interface TeacherAppLayoutProps {
  children: ReactNode;
}

export function TeacherAppLayout({ children }: TeacherAppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+var(--safe-bottom))] safe-px box-border overflow-x-hidden">
      <div className="mx-auto w-full overflow-x-hidden">
        {children}
      </div>
      <TeacherBottomNavigation />
    </div>
  );
}
