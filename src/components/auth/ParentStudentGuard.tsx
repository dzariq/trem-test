import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMyProfile } from "@/hooks/useMyProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const allowedRoles = new Set(["parent", "student"]);

export default function ParentStudentGuard() {
  const { loading: authLoading, user } = useAuth();
  const { profile, loading: profileLoading } = useMyProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const didRedirect = useRef(false);

  const loading = authLoading || profileLoading;

  useEffect(() => {
    if (loading) return;
    
    // If no user, redirect to login
    if (!user) {
      navigate("/login?portal=family", { replace: true, state: { from: location.pathname } });
      return;
    }
    
    // If no profile or wrong role, redirect with error
    if (!profile || !allowedRoles.has(profile.role)) {
      if (!didRedirect.current) {
        didRedirect.current = true;
        toast.error("This portal is only available to parent/student accounts.");
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
