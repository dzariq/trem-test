import { useCampus } from "@/contexts/CampusContext";
import { useUserRoles } from "@/hooks/useUserRoles";
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

  const showCampus = campuses.length >= 2;
  const showPortal = hasParentRole && hasTeacherRole;

  if (!showCampus && !showPortal) return null;

  return (
    <div className="sticky top-0 z-30 w-full bg-muted/50 backdrop-blur-sm border-b border-border/60">
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