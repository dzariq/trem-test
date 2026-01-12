import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import schoolBadge from "@/assets/school-badge.png";
import { supabase } from "@/lib/supabase";

type PortalType = "teacher" | "family";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portal = useMemo<PortalType | null>(() => {
    const value = searchParams.get("portal");
    if (value === "teacher" || value === "family") return value;
    return null;
  }, [searchParams]);

  const portalLabel =
    portal === "teacher" ? "Teacher Portal" : "Parent / Student Portal";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!portal) {
      setError("Please select a portal to continue.");
      return;
    }
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Login failed. Check credentials.");
      setLoading(false);
      return;
    }

    const authUser = authData.user;

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (profileError) {
      await supabase.auth.signOut();
      setError("Unable to load account profile. Contact admin.");
      setLoading(false);
      return;
    }

    if (!profile) {
      await supabase.auth.signOut();
      setError("Account profile not found. Contact admin.");
      setLoading(false);
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      setError("Account disabled. Contact admin.");
      setLoading(false);
      return;
    }

    // Portal gating: ensure the account role matches the selected portal.
    const isTeacherPortalOk = portal === "teacher" && profile.role === "teacher";
    const isFamilyPortalOk =
      portal === "family" && (profile.role === "parent" || profile.role === "student");

    if (!isTeacherPortalOk && !isFamilyPortalOk) {
      await supabase.auth.signOut();
      setError("Wrong portal for this account.");
      setLoading(false);
      return;
    }

    // Redirect based on role/portal after successful checks.
    if (portal === "teacher") {
      navigate("/teacher", { replace: true });
    } else {
      navigate("/portal", { replace: true });
    }
  };

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
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
