import { useState, useEffect } from "react";
import { Home, UserCheck, Calendar, HeadphonesIcon, LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import academicOwlIcon from "@/assets/academic-owl-icon.png";

type NavItem = {
  to: string;
  icon?: LucideIcon;
  customIcon?: string;
  label: string;
};

const navItems: NavItem[] = [
  { to: "/parent", icon: Home, label: "Home" },
  { to: "/parent/attendance", icon: UserCheck, label: "Attendance" },
  { to: "/parent/academic", customIcon: academicOwlIcon, label: "Academic" },
  { to: "/parent/calendar", icon: Calendar, label: "Calendar" },
  { to: "/parent/support", icon: HeadphonesIcon, label: "Support" },
];

export function BottomNavigation() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 transition-transform duration-300 bottom-tabbar",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/parent"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.customIcon ? (
                  <img src={item.customIcon} alt={item.label} className="h-5 w-5 mb-1" />
                ) : item.icon ? (
                  <item.icon className={cn("h-5 w-5 mb-1", isActive && "stroke-[2.5px]")} />
                ) : null}
                <span className="text-xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
