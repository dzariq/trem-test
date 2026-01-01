import { ReactNode } from "react";
import { TeacherBottomNavigation } from "./TeacherBottomNavigation";

interface TeacherAppLayoutProps {
  children: ReactNode;
}

export function TeacherAppLayout({ children }: TeacherAppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto">
        {children}
      </div>
      <TeacherBottomNavigation />
    </div>
  );
}
