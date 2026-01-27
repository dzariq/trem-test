import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+var(--safe-bottom))]" style={{ paddingTop: "var(--safe-top)", paddingLeft: "var(--safe-left)", paddingRight: "var(--safe-right)" }}>
      <div className="max-w-lg mx-auto">
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
}

