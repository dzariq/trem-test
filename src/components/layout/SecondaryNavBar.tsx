import { useCampus } from "@/contexts/CampusContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentSelection } from "@/hooks/useStudentSelection";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { CampusToggle } from "@/components/campus/CampusToggle";
import { PortalSwitcher } from "@/components/layout/PortalSwitcher";

/**
 * Secondary nav row that sits directly below AppHeader.
 * Houses the campus toggle and portal switcher.
 * Renders only when at least one of the two controls would show; otherwise
 * returns null so it occupies no space.
 */
export function SecondaryNavBar() {
  const { campuses } = useCampus();
  const { hasParentRole, hasTeacherRole } = useUserRoles();
  const { portal } = useAuth();
  const { linkedStudents } = useStudentSelection();
  const location = useLocation();

  const onTeacherRoute = location.pathname.startsWith("/teacher");
  const isTeacherPortal = portal ? portal === "teacher" : onTeacherRoute;

  const HOME_ROUTES = new Set(["/portal", "/parent", "/students", "/teacher"]);
  if (!HOME_ROUTES.has(location.pathname)) return null;

  const parentCampusCount = useMemo(() => {
    const codes = new Set<string>();
    linkedStudents.forEach((s) => {
      if (s.campus_code) codes.add(s.campus_code);
    });
    return codes.size;
  }, [linkedStudents]);

  const showCampus = isTeacherPortal
    ? campuses.length >= 2
    : parentCampusCount >= 2;
  const showPortal = hasParentRole && hasTeacherRole;

  if (!showCampus && !showPortal) return null;

  return (
    <div
      className="sticky top-0 z-30 w-full border-b border-border/60"
      style={{
        backgroundImage: isTeacherPortal
          ? "linear-gradient(to right, hsl(45 85% 58% / 0.18), hsl(45 85% 58% / 0.06), hsl(var(--background)))"
          : "linear-gradient(to right, hsl(var(--primary) / 0.18), hsl(var(--primary) / 0.06), hsl(var(--background)))",
      }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          {showCampus && <CampusToggle size="sm" />}
        </div>
        <div className="flex items-center">
          {showPortal && <PortalSwitcher size="sm" />}
        </div>
      </div>
    </div>
  );
}