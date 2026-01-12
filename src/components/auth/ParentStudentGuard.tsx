import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMyProfile } from "@/hooks/useMyProfile";

const allowedRoles = new Set(["parent", "student"]);

export default function ParentStudentGuard() {
  const { profile, loading } = useMyProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!profile || !allowedRoles.has(profile.role)) {
      if (!didRedirect.current) {
        didRedirect.current = true;
        toast.error("This portal is only available to parent/student accounts.");
      }
      navigate("/", { replace: true, state: { from: location.pathname } });
    }
  }, [loading, profile, navigate, location.pathname]);

  if (loading) return null;
  if (!profile || !allowedRoles.has(profile.role)) return null;

  return <Outlet />;
}
