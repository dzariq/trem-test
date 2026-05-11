import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function TeacherGuard() {
  const { loading, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const didRedirect = useRef(false);

  // Profile may still be loading even after auth loading finishes
  const profileStillLoading = !loading && !!user && !profile;

  useEffect(() => {
    if (loading || profileStillLoading) return;
    
    // If no user, redirect to login
    if (!user) {
      navigate("/login?portal=teacher", { replace: true, state: { from: location.pathname } });
      return;
    }
    
    // Profile loaded but wrong role — redirect with error.
    // Treat admin-like roles (admin, super_admin) as teacher for portal access.
    const teacherLike = new Set(["teacher", "admin", "super_admin"]);
    if (profile && !teacherLike.has(profile.role)) {
      if (!didRedirect.current) {
        didRedirect.current = true;
        toast.error("This portal is only available to teacher accounts.");
      }
      navigate("/", { replace: true, state: { from: location.pathname } });
    }
  }, [loading, profileStillLoading, user, profile, navigate, location.pathname]);

  // Show loading spinner while checking auth or profile
  if (loading || profileStillLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || !profile || !["teacher", "admin", "super_admin"].includes(profile.role)) return null;

  return <Outlet />;
}
