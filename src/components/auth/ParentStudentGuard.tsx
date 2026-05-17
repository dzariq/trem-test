import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const allowedRoles = new Set(["parent", "student", "user"]);

export default function ParentStudentGuard() {
  const { loading, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const didRedirect = useRef(false);

  const loadingScreen = (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  useEffect(() => {
    if (loading) return;
    
    // If no user, redirect to login
    if (!user) {
      navigate("/login?portal=family", { replace: true, state: { from: location.pathname } });
      return;
    }

    // Profile can briefly be null while Supabase restores/refreshes the session.
    // Do not blank or redirect the parent portal until the role is actually known.
    if (!profile) return;
    
    // If wrong role, redirect silently (no warning toast)
    if (!allowedRoles.has(profile.role)) {
      if (!didRedirect.current) {
        didRedirect.current = true;
        // Removed the incorrect warning toast - auth routing handles role mismatches
      }
      navigate("/", { replace: true, state: { from: location.pathname } });
    }
  }, [loading, user, profile, navigate, location.pathname]);

  // Show loading spinner while checking auth
  if (loading || !user || !profile) return loadingScreen;
  
  if (!allowedRoles.has(profile.role)) return loadingScreen;

  return <Outlet />;
}
