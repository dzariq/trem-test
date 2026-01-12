import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import schoolBadge from "@/assets/school-badge.png";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock } from "lucide-react";

// Feature flag for phone OTP login (disabled for now)
const ENABLE_PHONE_LOGIN = false;

type PortalType = "teacher" | "family";

export default function Login() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, portal: storedPortal, setPortal } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Get portal from URL params first, fallback to stored portal
  const portal = useMemo<PortalType | null>(() => {
    const urlPortal = searchParams.get("portal");
    if (urlPortal === "teacher" || urlPortal === "family") {
      return urlPortal;
    }
    // Fallback to stored portal
    if (storedPortal === "teacher" || storedPortal === "family") {
      return storedPortal;
    }
    return null;
  }, [searchParams, storedPortal]);

  // Update stored portal when URL portal changes
  useEffect(() => {
    const urlPortal = searchParams.get("portal");
    if (urlPortal === "teacher" || urlPortal === "family") {
      setPortal(urlPortal);
    }
  }, [searchParams, setPortal]);

  const portalLabel =
    portal === "teacher" ? "Teacher Portal" : "Parent / Student Portal";

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (user && profile) {
      // User is already logged in with a profile, redirect based on role
      if (profile.role === "teacher") {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/portal", { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate]);

  // If no portal selected, redirect to portal selector
  useEffect(() => {
    if (authLoading) return;
    if (!user && !portal) {
      navigate("/", { replace: true });
    }
  }, [user, portal, authLoading, navigate]);

  // Email + Password login
  const handleLogin = async () => {
    if (!portal) {
      setError("Please select a portal to continue.");
      return;
    }
    
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError || !authData.user) {
        setError(signInError?.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Fetch profile to verify and get role
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        await supabase.auth.signOut();
        setError("Account profile not found. Contact admin.");
        setLoading(false);
        return;
      }

      if (!profileData.is_active) {
        await supabase.auth.signOut();
        setError("Account disabled. Contact admin.");
        setLoading(false);
        return;
      }

      // Verify portal matches role
      const isTeacherPortalOk = portal === "teacher" && profileData.role === "teacher";
      const isFamilyPortalOk = portal === "family" && (profileData.role === "parent" || profileData.role === "student" || profileData.role === "user");

      if (!isTeacherPortalOk && !isFamilyPortalOk) {
        await supabase.auth.signOut();
        setError("Wrong portal for this account.");
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (profileData.role === "teacher") {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/portal", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already logged in, show loading (redirect is happening)
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
        <h1 className="text-2xl font-bold text-foreground">Welcome to School Portal</h1>
        <p className="text-muted-foreground mt-2">{portalLabel}</p>
      </div>

      <div className="grid gap-6 w-full max-w-md">
        <Card className="border-2 border-border">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      document.getElementById("password")?.focus();
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-destructive">{error}</p>}
            
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>

            {/* Phone OTP login - Coming Soon */}
            {!ENABLE_PHONE_LOGIN && (
              <p className="text-xs text-center text-muted-foreground">
                Phone login coming soon
              </p>
            )}
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Portal Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
