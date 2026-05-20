import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, Loader2 } from "lucide-react";
import schoolBadge from "@/assets/school-badge.png";
import { useAuth } from "@/contexts/AuthContext";

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { user, profile, loading, setPortal, portal } = useAuth();

  // If user is already authenticated, redirect to appropriate portal
  useEffect(() => {
    if (loading) return;

    if (user && profile) {
      // Honor the portal the user selected at login. Users with multiple
      // roles (parent + teacher) can switch between portals from their profile.
      if (portal === "teacher") {
        navigate("/teacher", { replace: true });
      } else if (portal === "family") {
        navigate("/portal", { replace: true });
      } else if (["teacher", "admin", "super_admin"].includes(profile.role)) {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/portal", { replace: true });
      }
    }
  }, [user, profile, loading, navigate, portal]);

  const handlePortalSelect = (portalType: "teacher" | "family") => {
    setPortal(portalType);
    navigate(`/login?portal=${portalType}`);
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated but we haven't redirected yet, show loading
  if (user && profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <img src={schoolBadge} alt="School Badge" className="h-24 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground whitespace-pre-line">
          {"Welcome to\nSchool Portal"}
        </h1>
        <p className="text-muted-foreground mt-2">Select your portal to continue</p>
      </div>

      <div className="grid gap-6 w-full max-w-md">
        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary"
          onClick={() => handlePortalSelect("family")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Parent / Student Portal</h2>
              <p className="text-sm text-muted-foreground">View attendance, grades, and school updates</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary"
          onClick={() => handlePortalSelect("teacher")}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Teacher Portal</h2>
              <p className="text-sm text-muted-foreground">Manage attendance, grades, and class activities</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
