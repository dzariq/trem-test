import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { useCcaPushReminders } from "@/hooks/useCcaPushReminders";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useCcaPushReminders();
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+var(--safe-bottom))] safe-px box-border overflow-x-hidden">
      <div className="max-w-lg mx-auto">
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
}

