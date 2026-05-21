import { useState, useEffect, useRef } from "react";
import { Home, UserCheck, Calendar, Menu, LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import academicOwlIcon from "@/assets/academic-owl-icon.png";
import { TeacherMoreSheet, MORE_ROUTES } from "./TeacherMoreSheet";

type NavItem = {
  to: string;
  icon?: LucideIcon;
  customIcon?: string;
  label: string;
};

const navItems: NavItem[] = [
  { to: "/teacher", icon: Home, label: "Home" },
  { to: "/teacher/attendance", icon: UserCheck, label: "Attend" },
  { to: "/teacher/academic", customIcon: academicOwlIcon, label: "Academic" },
  { to: "/teacher/calendar", icon: Calendar, label: "Calendar" },
];

export function TeacherBottomNavigation() {
  const [isVisible, setIsVisible] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const lastScrollYRef = useRef(0);
  useEffect(() => {
    const scrollEl = document.querySelector('[data-app-scroll="true"]') as HTMLElement | null;
    const target: HTMLElement | Window = scrollEl ?? window;

    const getScrollY = () =>
      target instanceof Window ? target.scrollY : target.scrollTop;

    const handleScroll = () => {
      const currentScrollY = getScrollY();
      const lastScrollY = lastScrollYRef.current;
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      lastScrollYRef.current = currentScrollY;
    };
    target.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => target.removeEventListener("scroll", handleScroll);
  }, []);
  const isMoreActive = MORE_ROUTES.some((r) =>
    location.pathname === r.to || location.pathname.startsWith(r.to + "/")
  );

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 transition-transform duration-300 bottom-tabbar",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="grid grid-cols-5 items-stretch py-2 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/teacher"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 w-full",
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
                    <item.icon
                      className={cn("h-5 w-5 mb-1", isActive && "stroke-[2.5px]")}
                    />
                  ) : null}
                  <span className="text-xs font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 w-full",
              isMoreActive || moreOpen
                ? "text-primary bg-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            aria-label="More options"
          >
            <Menu
              className={cn(
                "h-5 w-5 mb-1",
                (isMoreActive || moreOpen) && "stroke-[2.5px]"
              )}
            />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      <TeacherMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
