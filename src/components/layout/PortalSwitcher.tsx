import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Users, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { cn } from "@/lib/utils";

interface PortalSwitcherProps {
  size?: "sm" | "md";
  className?: string;
}

const PARENT_ACTIVE_STYLE =
  "bg-[hsl(45_85%_58%/0.25)] text-[hsl(35_85%_28%)] border-[hsl(38_78%_42%/0.6)]";
const TEACHER_ACTIVE_STYLE = "bg-primary/15 text-primary border-primary/50";
const INACTIVE_STYLE =
  "bg-transparent text-muted-foreground border-transparent hover:text-foreground";

/**
 * Segmented Parent / Teacher portal toggle. Only renders for users that
 * carry BOTH the parent and teacher roles in user_roles. Clicking the
 * inactive side flips the stored portal preference, clears the query
 * cache, and routes to the matching portal landing page.
 */
export function PortalSwitcher({ size = "sm", className }: PortalSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { portal, setPortal } = useAuth();
  const { hasParentRole, hasTeacherRole, isLoading } = useUserRoles();

  // Derive active state from current route so the pill is correct even when
  // portal preference is null (legacy sessions, first visit, etc.)
  const onTeacherRoute = location.pathname.startsWith("/teacher");
  const isTeacher = portal ? portal === "teacher" : onTeacherRoute;

  const switchTo = useCallback(
    (target: "family" | "teacher") => {
      if ((target === "family" && isTeacher === false) || (target === "teacher" && isTeacher === true)) return;
      setPortal(target);
      queryClient.clear();
      navigate(target === "teacher" ? "/teacher" : "/portal", { replace: true });
    },
    [isTeacher, setPortal, queryClient, navigate]
  );

  if (isLoading) return null;
  if (!hasParentRole || !hasTeacherRole) return null;

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div
      role="group"
      aria-label="Active portal"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border-2 border-border bg-background p-0.5 shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={() => switchTo("family")}
        aria-pressed={!isTeacher}
        title="Parent portal"
        className={cn(
          "inline-flex items-center gap-1 rounded-sm border-2 font-semibold transition-colors",
          sizeClasses,
          !isTeacher ? PARENT_ACTIVE_STYLE : INACTIVE_STYLE
        )}
      >
        <Users className={iconSize} />
        Parent
      </button>
      <button
        type="button"
        onClick={() => switchTo("teacher")}
        aria-pressed={isTeacher}
        title="Teacher portal"
        className={cn(
          "inline-flex items-center gap-1 rounded-sm border-2 font-semibold transition-colors",
          sizeClasses,
          isTeacher ? TEACHER_ACTIVE_STYLE : INACTIVE_STYLE
        )}
      >
        <GraduationCap className={iconSize} />
        Teacher
      </button>
    </div>
  );
}
