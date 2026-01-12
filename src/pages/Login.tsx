import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import schoolBadge from "@/assets/school-badge.png";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Phone, ArrowLeft } from "lucide-react";

type PortalType = "teacher" | "family";
type LoginStep = "phone" | "otp";

// Normalize phone to E.164 format (Malaysia default)
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, "");
  
  // Handle Malaysian numbers
  if (digits.startsWith("0")) {
    // Convert 0XX to +60XX
    digits = "60" + digits.slice(1);
  } else if (!digits.startsWith("60") && digits.length >= 9 && digits.length <= 10) {
    // Assume Malaysian if 9-10 digits without country code
    digits = "60" + digits;
  }
  
  return "+" + digits;
}

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  
  const portal = useMemo<PortalType | null>(() => {
    const value = searchParams.get("portal");
    if (value === "teacher" || value === "family") return value;
    return null;
  }, [searchParams]);

  const portalLabel =
    portal === "teacher" ? "Teacher Portal" : "Parent / Student Portal";

  // Login state
  const [step, setStep] = useState<LoginStep>("phone");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      // User is already logged in, check their profile and redirect
      supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile) {
            if (profile.role === "teacher") {
              navigate("/teacher", { replace: true });
            } else {
              navigate("/portal", { replace: true });
            }
          }
        });
    }
  }, [user, authLoading, navigate]);

  // Check if phone exists in our system
  const handleSendOtp = async () => {
    if (!portal) {
      setError("Please select a portal to continue.");
      return;
    }
    
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    setError(null);
    setLoading(true);

    const normalized = normalizePhone(phone);
    setNormalizedPhone(normalized);

    try {
      // Check if phone exists using our secure function
      const { data, error: checkError } = await supabase.rpc("check_phone_exists", {
        phone_number: normalized,
      });

      if (checkError) {
        console.error("Phone check error:", checkError);
        setError("Unable to verify phone number. Please try again.");
        setLoading(false);
        return;
      }

      if (!data?.exists) {
        setError("Phone number not registered. Please contact admin.");
        setLoading(false);
        return;
      }

      // Verify portal matches role
      const role = data.role;
      setUserRole(role);
      
      const isTeacherPortalOk = portal === "teacher" && role === "teacher";
      const isFamilyPortalOk = portal === "family" && (role === "parent" || role === "student");

      if (!isTeacherPortalOk && !isFamilyPortalOk) {
        setError("Wrong portal for this account.");
        setLoading(false);
        return;
      }

      // Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalized,
      });

      if (otpError) {
        console.error("OTP send error:", otpError);
        setError(otpError.message || "Failed to send OTP. Please try again.");
        setLoading(false);
        return;
      }

      // Move to OTP step
      setStep("otp");
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: otp,
        type: "sms",
      });

      if (verifyError || !authData.user) {
        setError(verifyError?.message || "Invalid OTP. Please try again.");
        setLoading(false);
        return;
      }

      // Fetch profile to verify and get role
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
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

      // Redirect based on role
      if (profile.role === "teacher") {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/portal", { replace: true });
      }
    } catch (err) {
      console.error("Verify error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Go back to phone step
  const handleBack = () => {
    setStep("phone");
    setOtp("");
    setError(null);
  };

  // Show loading while checking auth
  if (authLoading) {
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
            {step === "phone" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0123456789"
                      className="pl-10"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendOtp();
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your registered phone number
                  </p>
                </div>
                
                {error && <p className="text-sm text-destructive">{error}</p>}
                
                <Button className="w-full" onClick={handleSendOtp} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Enter the 6-digit code sent to
                    </p>
                    <p className="font-medium">{normalizedPhone}</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      onComplete={handleVerifyOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                
                <Button className="w-full" onClick={handleVerifyOtp} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Change Phone Number
                </Button>
              </>
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