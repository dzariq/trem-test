import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { allCountries } from "country-telephone-data";
import { supabase } from "@/lib/supabase";
import { updateMyProfile } from "@/data/profile";
import { toast } from "sonner";

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
const DEFAULT_ISO2 = "my";
const isoToFlag = (iso2: string) =>
  iso2.toUpperCase().replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));

function normalizeDigits(input: string): string {
  let d = (input || "").replace(/\D+/g, "");
  while (d.startsWith("0")) d = d.slice(1);
  return d;
}

// Try to split a stored phone like "+60172292966" / "60172292966" / "0172292966"
// into { iso2, digits }. Falls back to DEFAULT_ISO2 if it can't tell.
function splitStoredPhone(stored: string | null | undefined): { iso2: string; digits: string } {
  const raw = (stored || "").trim();
  if (!raw) return { iso2: DEFAULT_ISO2, digits: "" };
  const digits = normalizeDigits(raw);
  if (raw.startsWith("+")) {
    // Match longest dial code first
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (digits.startsWith(c.dialCode)) {
        return { iso2: c.iso2, digits: digits.slice(c.dialCode.length) };
      }
    }
  }
  // No "+", just show raw digits with default country
  return { iso2: DEFAULT_ISO2, digits };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentEmail: string;
  currentPhone: string | null;
  currentRelationship: string | null;
  currentRelationshipOther: string | null;
  isParent: boolean;
  onSaved: () => void;
  onEmailChangedRequiresRelogin: (newEmail: string) => void;
};

type Step = "form" | "verifyPhone" | "verifyEmail";

export function EditContactDialog({
  open,
  onOpenChange,
  currentName,
  currentEmail,
  currentPhone,
  currentRelationship,
  currentRelationshipOther,
  isParent,
  onSaved,
  onEmailChangedRequiresRelogin,
}: Props) {
  const initialSplit = useMemo(() => splitStoredPhone(currentPhone), [currentPhone]);

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState(currentName);
  const [email, setEmail] = useState(currentEmail);
  const [phoneIso2, setPhoneIso2] = useState(initialSplit.iso2);
  const [phoneDigits, setPhoneDigits] = useState(initialSplit.digits);
  const [relationship, setRelationship] = useState(currentRelationship ?? "");
  const [relationshipOther, setRelationshipOther] = useState(currentRelationshipOther ?? "");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset whenever dialog opens
  useEffect(() => {
    if (open) {
      setStep("form");
      setName(currentName);
      setEmail(currentEmail);
      const split = splitStoredPhone(currentPhone);
      setPhoneIso2(split.iso2);
      setPhoneDigits(split.digits);
      setRelationship(currentRelationship ?? "");
      setRelationshipOther(currentRelationshipOther ?? "");
      setOtp("");
      setError(null);
      setBusy(false);
    }
  }, [open, currentName, currentEmail, currentPhone, currentRelationship, currentRelationshipOther]);

  const country = COUNTRIES.find((c) => c.iso2 === phoneIso2) ?? COUNTRIES.find((c) => c.iso2 === DEFAULT_ISO2)!;

  const initialDigits = initialSplit.digits;
  const phoneChanged = normalizeDigits(phoneDigits) !== initialDigits || phoneIso2 !== initialSplit.iso2;
  const emailChanged = email.trim().toLowerCase() !== (currentEmail || "").trim().toLowerCase();
  const nameChanged = name !== currentName;
  const relationshipChanged =
    (relationship || "") !== (currentRelationship ?? "") ||
    (relationship === "Other" && (relationshipOther || "") !== (currentRelationshipOther ?? ""));

  // Save profile fields that don't need verification
  async function saveProfileBasics() {
    if (!nameChanged && !relationshipChanged && !phoneChanged && !emailChanged) {
      onOpenChange(false);
      return;
    }
    if (nameChanged || relationshipChanged) {
      await updateMyProfile({
        full_name: name,
        parent_relationship: relationship || null,
        parent_relationship_other:
          relationship === "Other" ? (relationshipOther || null) : null,
      });
    }
  }

  // ---- Step 1: Save handler ----
  async function handleSave() {
    setError(null);
    setBusy(true);
    try {
      // Basic validation
      if (emailChanged) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          throw new Error("Please enter a valid email address.");
        }
      }
      if (phoneChanged) {
        const d = normalizeDigits(phoneDigits);
        if (d.length < 6 || d.length > 15) {
          throw new Error("Please enter a valid phone number.");
        }
      }

      // Save name/relationship now (no verification needed)
      await saveProfileBasics();

      // If phone changed, request phone OTP and switch to verifyPhone step
      if (phoneChanged) {
        await requestPhoneOtp();
        setStep("verifyPhone");
        setOtp("");
        return;
      }
      // If only email changed, request email OTP
      if (emailChanged) {
        await requestEmailOtp();
        setStep("verifyEmail");
        setOtp("");
        return;
      }

      // Nothing else to do
      toast.success("Profile updated.");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save changes.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function requestPhoneOtp() {
    const res = await fetch("https://collinz.app.n8n.cloud/webhook/login-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "phone",
        phone: phoneDigits.replace(/\D+/g, ""),
        country_code: `+${country.dialCode}`,
        message: Math.floor(100000 + Math.random() * 900000).toString(),
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t || "Could not send SMS code. Try again.");
    }
  }

  async function requestEmailOtp() {
    const { error: fnErr, data } = await supabase.functions.invoke("send-email-otp", {
      body: { email: email.trim().toLowerCase() },
    });
    if (fnErr || !(data as { success?: boolean })?.success) {
      let serverMsg: string | undefined;
      const ctx = (fnErr as { context?: { json?: () => Promise<{ error?: string }> } })?.context;
      if (ctx?.json) {
        try {
          const body = await ctx.json();
          serverMsg = body?.error;
        } catch {
          // ignore
        }
      }
      throw new Error(serverMsg || fnErr?.message || "Could not send email code.");
    }
  }

  // ---- Step 2a: Verify phone ----
  async function handleVerifyPhone() {
    setError(null);
    setBusy(true);
    try {
      if (!/^\d{4,8}$/.test(otp.trim())) throw new Error("Enter the code we sent you.");
      const { error: fnErr, data } = await supabase.functions.invoke("update-contact", {
        body: {
          field: "phone",
          new_phone: phoneDigits.replace(/\D+/g, ""),
          country_code: `+${country.dialCode}`,
          otp: otp.trim(),
        },
      });
      if (fnErr || !(data as { success?: boolean })?.success) {
        let msg: string | undefined;
        const ctx = (fnErr as { context?: { json?: () => Promise<{ error?: string }> } })?.context;
        if (ctx?.json) {
          try { msg = (await ctx.json())?.error; } catch { /* ignore */ }
        }
        throw new Error(msg || fnErr?.message || "Could not verify code.");
      }
      toast.success("Phone updated. Use the new number to sign in next time.");

      // If email also changed, proceed to email verification next
      if (emailChanged) {
        await requestEmailOtp();
        setStep("verifyEmail");
        setOtp("");
      } else {
        onSaved();
        onOpenChange(false);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  // ---- Step 2b: Verify email ----
  async function handleVerifyEmail() {
    setError(null);
    setBusy(true);
    try {
      if (!/^\d{4,8}$/.test(otp.trim())) throw new Error("Enter the code we sent you.");
      const { error: fnErr, data } = await supabase.functions.invoke("update-contact", {
        body: {
          field: "email",
          new_email: email.trim().toLowerCase(),
          otp: otp.trim(),
        },
      });
      if (fnErr || !(data as { success?: boolean })?.success) {
        let msg: string | undefined;
        const ctx = (fnErr as { context?: { json?: () => Promise<{ error?: string }> } })?.context;
        if (ctx?.json) {
          try { msg = (await ctx.json())?.error; } catch { /* ignore */ }
        }
        throw new Error(msg || fnErr?.message || "Could not verify code.");
      }
      toast.success("Email updated. Please sign in again with your new email.");
      onEmailChangedRequiresRelogin(email.trim().toLowerCase());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const title =
    step === "verifyPhone"
      ? "Verify new phone number"
      : step === "verifyEmail"
        ? "Verify new email address"
        : "Edit Contact Information";

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {step === "form" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ec-name">Full Name</Label>
              <Input id="ec-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ec-email">Email</Label>
              <Input
                id="ec-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              {emailChanged && (
                <p className="text-[11px] text-muted-foreground">
                  We'll send a code to this new email to confirm it. Once confirmed,
                  you'll be signed out and need to sign in again with the new email.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ec-phone">Phone Number</Label>
              <div className="flex gap-2">
                <Select value={phoneIso2} onValueChange={setPhoneIso2}>
                  <SelectTrigger className="w-[120px] shrink-0">
                    <SelectValue>
                      <span className="flex items-center gap-1">
                        <span>{isoToFlag(country.iso2)}</span>
                        <span className="text-xs">+{country.dialCode}</span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.iso2} value={c.iso2}>
                        <span className="flex items-center gap-2">
                          <span>{isoToFlag(c.iso2)}</span>
                          <span className="text-xs">+{c.dialCode}</span>
                          <span className="text-xs text-muted-foreground truncate">{c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="ec-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="123456789"
                  className="flex-1"
                />
              </div>
              {phoneChanged && (
                <p className="text-[11px] text-muted-foreground">
                  We'll send an SMS code to this new number to confirm it.
                </p>
              )}
            </div>

            {isParent && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ec-rel">Relationship to Student</Label>
                  <Select value={relationship || undefined} onValueChange={setRelationship}>
                    <SelectTrigger id="ec-rel">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Legal Guardian">Legal Guardian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {relationship === "Other" && (
                  <div className="space-y-2">
                    <Label htmlFor="ec-rel-other">Please specify</Label>
                    <Input
                      id="ec-rel-other"
                      value={relationshipOther}
                      onChange={(e) => setRelationshipOther(e.target.value)}
                      placeholder="e.g. Grandparent, Aunt, Uncle"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {(step === "verifyPhone" || step === "verifyEmail") && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code we sent to{" "}
              <span className="font-medium text-foreground">
                {step === "verifyEmail"
                  ? email.trim().toLowerCase()
                  : `+${country.dialCode} ${phoneDigits}`}
              </span>.
            </p>
            <Input
              autoFocus
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="123456"
              className="text-center tracking-[0.4em] text-lg"
            />
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setError(null);
                setBusy(true);
                try {
                  if (step === "verifyEmail") await requestEmailOtp();
                  else await requestPhoneOtp();
                  toast.success("New code sent.");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Could not resend code.");
                } finally {
                  setBusy(false);
                }
              }}
              className="text-xs text-primary underline disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "form" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </>
          )}
          {step === "verifyPhone" && (
            <>
              <Button variant="outline" onClick={() => setStep("form")} disabled={busy}>
                Back
              </Button>
              <Button onClick={handleVerifyPhone} disabled={busy || otp.length < 4}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verify & Save
              </Button>
            </>
          )}
          {step === "verifyEmail" && (
            <>
              <Button variant="outline" onClick={() => setStep("form")} disabled={busy}>
                Back
              </Button>
              <Button onClick={handleVerifyEmail} disabled={busy || otp.length < 4}>
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verify & Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}