import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const allowedRoles = new Set(["parent", "student", "user"]);

export default function ParentStudentGuard() {
  const { loading, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (loading) return;
    
    // If no user, redirect to login
    if (!user) {
      navigate("/login?portal=family", { replace: true, state: { from: location.pathname } });
      return;
    }
    
    // If no profile or wrong role, redirect silently (no warning toast)
    if (!profile || !allowedRoles.has(profile.role)) {
      if (!didRedirect.current) {
        didRedirect.current = true;
        // Removed the incorrect warning toast - auth routing handles role mismatches
      }
      navigate("/", { replace: true, state: { from: location.pathname } });
    }
  }, [loading, user, profile, navigate, location.pathname]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || !profile || !allowedRoles.has(profile.role)) return null;

  return <Outlet />;
}
