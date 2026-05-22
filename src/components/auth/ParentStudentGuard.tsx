import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Loader2 } from "lucide-react";

const allowedRoles = new Set(["parent", "student", "user"]);

export default function ParentStudentGuard() {
  const { loading, user, profile } = useAuth();
  const { hasParentRole, hasStudentRole, isLoading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const didRedirect = useRef(false);

  const loadingScreen = (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  useEffect(() => {
    if (loading || rolesLoading) return;
    
    // If no user, redirect to login
    if (!user) {
      navigate("/login?portal=family", { replace: true, state: { from: location.pathname } });
      return;
    }

    // Profile can briefly be null while Supabase restores/refreshes the session.
    // Do not blank or redirect the parent portal until the role is actually known.
    if (!profile) return;
    
    // Allow access if the user has the parent role in user_roles
    // OR a legacy parent/student/user role on user_profiles.
    const allowed = hasParentRole || hasStudentRole || allowedRoles.has(profile.role);
    if (!allowed) {
      if (!didRedirect.current) {
        didRedirect.current = true;
      }
      navigate("/", { replace: true, state: { from: location.pathname } });
    }
  }, [loading, rolesLoading, hasParentRole, hasStudentRole, user, profile, navigate, location.pathname]);

  // Show loading spinner while checking auth
  if (loading || rolesLoading || !user || !profile) return loadingScreen;
  
  if (!hasParentRole && !hasStudentRole && !allowedRoles.has(profile.role)) return loadingScreen;

  return <Outlet />;
}
