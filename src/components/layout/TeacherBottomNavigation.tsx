import { useState, useEffect } from "react";
import { Home, UserCheck, GraduationCap, Calendar, ClipboardList } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
const navItems = [{
  to: "/teacher",
  icon: Home,
  label: "Home",
  labelLine2: ""
}, {
  to: "/teacher/attendance",
  icon: UserCheck,
  label: "Attendance",
  labelLine2: ""
}, {
  to: "/teacher/lesson-plans",
  icon: ClipboardList,
  label: "Lesson",
  labelLine2: "Plans"
}, {
  to: "/teacher/academic",
  icon: GraduationCap,
  label: "Academic",
  labelLine2: ""
}, {
  to: "/teacher/calendar",
  icon: Calendar,
  label: "Calendar",
  labelLine2: ""
}];
export function TeacherBottomNavigation() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);
  return <nav className={cn("fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 transition-transform duration-300", isVisible ? "translate-y-0" : "translate-y-full")}>
      <div className="flex justify-around items-stretch py-2 px-2">
        {navItems.map(item => <NavLink key={item.to} to={item.to} end={item.to === "/teacher"} className={({
        isActive
      }) => cn("flex flex-col items-center justify-start py-2 px-2 rounded-lg transition-all duration-200 flex-1 min-h-[60px]", isActive ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
            {({
          isActive
        }) => <>
                <item.icon className={cn("h-5 w-5 mb-1 shrink-0", isActive && "stroke-[2.5px]")} />
                <div className="flex flex-col items-center justify-center min-h-[24px]">
                  <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                  {item.labelLine2}
                </div>
              </>}
          </NavLink>)}
      </div>
    </nav>;
}