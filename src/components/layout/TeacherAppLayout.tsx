import { ReactNode } from "react";
import { TeacherBottomNavigation } from "./TeacherBottomNavigation";

interface TeacherAppLayoutProps {
  children: ReactNode;
}

export function TeacherAppLayout({ children }: TeacherAppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      <div className="mx-auto w-full px-3 sm:px-4 overflow-x-hidden">
        {children}
      </div>
      <TeacherBottomNavigation />
    </div>
  );
}
