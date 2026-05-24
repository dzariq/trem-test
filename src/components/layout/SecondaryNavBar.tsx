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
      className="sticky top-0 z-30 w-full border-y border-black/30 shadow-sm"
      style={{
        backgroundColor: "hsl(150 30% 15%)",
        backgroundImage:
          "linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "14px 14px",
        backgroundPosition: "0 0, 7px 7px",
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