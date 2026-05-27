import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { FullScreenLottieLoader } from "@/components/common/LottieLoader";

export default function TeacherGuard() {
  const { loading, user, profile, portal } = useAuth();
  const { hasTeacherRole, hasParentRole, hasStudentRole, isLoading: rolesLoading, isFetched: rolesFetched } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const didRedirect = useRef(false);

  // Profile may still be loading even after auth loading finishes
  const profileStillLoading = !loading && !!user && !profile;

  useEffect(() => {
    if (loading || profileStillLoading || rolesLoading || !rolesFetched) return;
    
    // If no user, redirect to login
    if (!user) {
      navigate("/login?portal=teacher", { replace: true, state: { from: location.pathname } });
      return;
    }

    // Dual-role users: if the active portal preference is "family",
    // bounce to the parent portal so the UI matches the user's choice.
    if (portal === "family" && (hasParentRole || hasStudentRole)) {
      navigate("/portal", { replace: true });
      return;
    }

    // Profile loaded but wrong role — redirect with error.
    // Treat admin-like roles (admin, super_admin) as teacher for portal access.
    const teacherLike = new Set(["teacher", "admin", "super_admin"]);
    const allowed = hasTeacherRole || (profile && teacherLike.has(profile.role));
    console.log("[auth-debug] TeacherGuard evaluate", { allowed, hasTeacherRole, profileRole: profile?.role, rolesFetched });
    if (profile && !allowed) {
      if (!didRedirect.current) {
        didRedirect.current = true;
        toast.error("This portal is only available to teacher accounts.");
      }
      console.log("[auth-debug] TeacherGuard -> redirect /");
      navigate("/", { replace: true, state: { from: location.pathname } });
    }
  }, [loading, profileStillLoading, rolesLoading, rolesFetched, hasTeacherRole, hasParentRole, hasStudentRole, user, profile, portal, navigate, location.pathname]);

  // Show loading spinner while checking auth or profile
  if (loading || profileStillLoading || rolesLoading || !rolesFetched) {
    return <FullScreenLottieLoader />;
  }
  
  if (!user || !profile) return null;
  const teacherLike = new Set(["teacher", "admin", "super_admin"]);
  if (!hasTeacherRole && !teacherLike.has(profile.role)) return null;

  return <Outlet />;
}
