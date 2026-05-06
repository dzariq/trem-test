import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import schoolBadge from "@/assets/school-badge.png";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Phone, ArrowLeft, Mail } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { allCountries } from "country-telephone-data";

// Build a clean country list: { iso2, name, dialCode }
// Deduplicate by iso2 and sort alphabetically by name.
const COUNTRIES = (() => {
  const seen = new Set<string>();
  const list: { iso2: string; name: string; dialCode: string }[] = [];
  for (const c of allCountries as Array<{ iso2: string; name: string; dialCode: string }>) {
    if (seen.has(c.iso2)) continue;
    seen.add(c.iso2);
    list.push({ iso2: c.iso2, name: c.name, dialCode: c.dialCode });
  }
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
})();

const DEFAULT_ISO2 = "my"; // Malaysia

const OTP_REQUEST_URL = "https://collinz.app.n8n.cloud/webhook/login-otp";
const OTP_VERIFY_URL = "https://collinz.app.n8n.cloud/webhook/verify-otp";
const OTP_TTL_SECONDS = 30;

// Convert iso2 -> flag emoji
const isoToFlag = (iso2: string) =>
  iso2
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));

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
  const [countryIso2, setCountryIso2] = useState<string>(DEFAULT_ISO2);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP state
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");

  const selectedCountry =
    COUNTRIES.find((c) => c.iso2 === countryIso2) ?? COUNTRIES[0];

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

  // Phone-only sanitizer: digits only, must not start with 0,
  // strips spaces, dashes, parentheses, plus signs, and any other non-digits.
  const sanitizePhone = (raw: string): string => {
    let digits = raw.replace(/\D+/g, "");
    while (digits.startsWith("0")) digits = digits.slice(1);
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(sanitizePhone(e.target.value));
  };

  // Countdown ticker for OTP TTL
  useEffect(() => {
    if (step !== "otp" || !otpExpiresAt) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((otpExpiresAt - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [step, otpExpiresAt]);

  const fullNumber = `+${selectedCountry.dialCode}${phone}`;
  const otpDestination = method === "email" ? email : fullNumber;

  // Generate a 6-digit OTP code
  const generateOtpCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Step 1: request OTP
  const handleRequestOtp = async () => {
    if (!portal) {
      setError("Please select a portal to continue.");
      return;
    }

    if (method === "phone") {
      if (!phone) {
        setError("Please enter your phone number.");
        return;
      }
      if (phone.startsWith("0")) {
        setError("Phone number must not start with 0.");
        return;
      }
      if (!/^\d+$/.test(phone)) {
        setError("Phone number must contain digits only.");
        return;
      }
      if (phone.length < 6 || phone.length > 15) {
        setError("Please enter a valid phone number.");
        return;
      }
    } else {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      const otpCode = generateOtpCode();

      const res = await fetch(OTP_REQUEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: method,
          phone: method === "email" ? email : phone,
          country_code: method === "email" ? "" : `+${selectedCountry.dialCode}`,
          message: otpCode,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      setGeneratedOtp(otpCode);
      setOtp("");
      setOtpExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
      setStep("otp");
    } catch (err) {
      console.error("[Login] OTP request failed:", err);
      setError(
        err instanceof Error
          ? `Failed to send OTP: ${err.message}`
          : "Failed to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError("Please enter the OTP code.");
      return;
    }

    if (secondsLeft <= 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(OTP_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: method,
          phone: method === "email" ? email : phone,
          otp,
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        // non-JSON response
      }

      if (!res.ok) {
        throw new Error(
          (data && (data.message || data.error)) ||
            text ||
            `Verification failed (${res.status})`,
        );
      }

      // n8n may return an array or object; normalize to find status
      const payload = Array.isArray(data) ? data[0] : data;
      const statusVal = payload?.status;
      const statusOk =
        statusVal === 1 || statusVal === "1" || statusVal === true;

      if (!statusOk) {
        throw new Error(
          (payload && (payload.message || payload.error)) ||
            "Invalid OTP. Please try again.",
        );
      }

      // Look up the parent by phone via edge function and mint a session token
      const { data: loginData, error: loginErr } = await supabase.functions.invoke(
        "phone-login",
        {
          body:
            method === "email"
              ? { email }
              : {
                  phone,
                  country_code: `+${selectedCountry.dialCode}`,
                },
        },
      );

      if (loginErr || !loginData?.token_hash || !loginData?.email) {
        // supabase.functions.invoke wraps non-2xx as FunctionsHttpError and
        // does NOT parse the body — read it from the underlying Response.
        let serverMsg: string | undefined;
        const ctx = (loginErr as any)?.context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            serverMsg = body?.error || body?.message;
          } catch {
            try {
              serverMsg = await ctx.text();
            } catch {
              /* ignore */
            }
          }
        }
        throw new Error(
          serverMsg ||
            (loginData as any)?.error ||
            loginErr?.message ||
            "No parent account found for this phone number.",
        );
      }

      const { error: verifyErr } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: loginData.token_hash,
      });

      if (verifyErr) {
        throw new Error(verifyErr.message || "Failed to create session.");
      }

      // AuthContext will pick up the new session and redirect via useEffect.
    } catch (err) {
      console.error("[Login] OTP verify failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Invalid OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setOtp("");
    setOtpExpiresAt(null);
    setSecondsLeft(0);
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
            {step === "phone" && (
            <>
            <Tabs value={method} onValueChange={(v) => { setMethod(v as "email" | "phone"); setError(null); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">
                  <Mail className="mr-2 h-4 w-4" /> Email
                </TabsTrigger>
                <TabsTrigger value="phone">
                  <Phone className="mr-2 h-4 w-4" /> Phone
                </TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="space-y-2 mt-4">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRequestOtp();
                    }}
                    placeholder="you@example.com"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a one-time code to your email.
                </p>
              </TabsContent>
              <TabsContent value="phone" className="space-y-2 mt-4">
              <Label htmlFor="phone">Phone number</Label>
              <div className="flex gap-2">
                <Select value={countryIso2} onValueChange={setCountryIso2}>
                  <SelectTrigger className="w-[130px] shrink-0" aria-label="Country code">
                    <SelectValue>
                      <span className="flex items-center gap-1.5">
                        <span className="text-base leading-none">
                          {isoToFlag(selectedCountry.iso2)}
                        </span>
                        <span className="text-sm">+{selectedCountry.dialCode}</span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.iso2} value={c.iso2}>
                        <span className="flex items-center gap-2">
                          <span className="text-base leading-none">
                            {isoToFlag(c.iso2)}
                          </span>
                          <span className="truncate">{c.name}</span>
                          <span className="text-muted-foreground ml-auto">
                            +{c.dialCode}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRequestOtp();
                    }}
                    placeholder="Phone number"
                    className="pl-10"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Digits only. Do not include a leading 0.
              </p>
              </TabsContent>
            </Tabs>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button className="w-full" onClick={handleRequestOtp} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Back to Portal Selection
            </Button>
            </>
            )}

            {step === "otp" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <p className="text-xs text-muted-foreground">
                  Sent to <span className="font-medium text-foreground">{otpDestination}</span>
                </p>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D+/g, "").slice(0, 8))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerifyOtp();
                  }}
                  placeholder="123456"
                  className="text-center tracking-[0.4em] text-lg"
                  disabled={secondsLeft <= 0}
                />
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={
                      secondsLeft > 0
                        ? "text-muted-foreground"
                        : "text-destructive font-medium"
                    }
                  >
                    {secondsLeft > 0
                      ? `Expires in ${secondsLeft}s`
                      : "OTP expired"}
                  </span>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading || secondsLeft > 0}
                    className="text-primary disabled:text-muted-foreground disabled:cursor-not-allowed hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full"
                onClick={handleVerifyOtp}
                disabled={loading || secondsLeft <= 0 || otp.length < 4}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleBackToPhone}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Change phone number
              </Button>
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
