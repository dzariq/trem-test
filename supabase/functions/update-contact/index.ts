// Updates the signed-in user's own email or phone after verifying ownership
// of the NEW contact value via OTP.
//
//   - field=phone : OTP verified against the n8n verify-otp webhook.
//                   Updates user_profiles.phone only.
//   - field=email : OTP verified against auth_email_otps for the NEW email.
//                   Updates auth.users.email AND user_profiles.email atomically.
//                   Caller must sign out and sign in again (requires_relogin: true).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_OTP_ATTEMPTS = 5;
const PHONE_OTP_VERIFY_URL = "https://collinz.app.n8n.cloud/webhook/verify-otp";

function normalizeDigits(input: string | null | undefined): string {
  if (!input) return "";
  let d = String(input).replace(/\D+/g, "");
  while (d.startsWith("0")) d = d.slice(1);
  return d;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Missing authorization" }, 401);
    }

    // Resolve the caller's user_id from their JWT (validated by Supabase auth)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Invalid session" }, 401);
    }
    const callerId = userData.user.id;
    const callerEmail = (userData.user.email ?? "").toLowerCase();

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const field = String(body?.field ?? "").trim().toLowerCase();
    const otp = String(body?.otp ?? "").trim();

    if (field !== "email" && field !== "phone") {
      return json({ error: "field must be 'email' or 'phone'" }, 400);
    }
    if (!/^\d{4,8}$/.test(otp)) {
      return json({ error: "OTP code is required" }, 400);
    }

    // ============================================================
    //   EMAIL CHANGE
    // ============================================================
    if (field === "email") {
      const newEmail = String(body?.new_email ?? "").trim().toLowerCase();
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) || newEmail.length > 254) {
        return json({ error: "Please provide a valid email address." }, 400);
      }
      if (newEmail === callerEmail) {
        return json({ error: "New email is the same as the current one." }, 400);
      }

      // Uniqueness: not in use by another auth user or profile
      const { data: existingProfiles, error: dupProfileErr } = await admin
        .from("user_profiles")
        .select("user_id")
        .ilike("email", newEmail)
        .neq("user_id", callerId)
        .limit(1);
      if (dupProfileErr) {
        console.error("[update-contact] dup profile check failed", dupProfileErr);
        return json({ error: "Could not verify availability. Try again." }, 500);
      }
      if (existingProfiles && existingProfiles.length > 0) {
        return json({ error: "This email is already in use by another account." }, 409);
      }

      // Verify the OTP that was sent to the NEW email
      const { data: otpRow, error: otpErr } = await admin
        .from("auth_email_otps")
        .select("id, code_hash, expires_at, attempts, consumed")
        .eq("email", newEmail)
        .eq("consumed", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (otpErr) {
        console.error("[update-contact] otp lookup failed", otpErr);
        return json({ error: "Verification failed" }, 500);
      }
      if (!otpRow) {
        return json({ error: "No OTP issued for this email. Request a new code." }, 400);
      }
      if (new Date(otpRow.expires_at).getTime() < Date.now()) {
        await admin.from("auth_email_otps").update({ consumed: true }).eq("id", otpRow.id);
        return json({ error: "OTP has expired. Please request a new code." }, 400);
      }
      if ((otpRow.attempts ?? 0) >= MAX_OTP_ATTEMPTS) {
        await admin.from("auth_email_otps").update({ consumed: true }).eq("id", otpRow.id);
        return json({ error: "Too many attempts. Please request a new code." }, 429);
      }
      const providedHash = await sha256Hex(otp);
      if (providedHash !== otpRow.code_hash) {
        await admin
          .from("auth_email_otps")
          .update({ attempts: (otpRow.attempts ?? 0) + 1 })
          .eq("id", otpRow.id);
        return json({ error: "Invalid OTP code." }, 401);
      }

      // Commit: update auth.users + user_profiles
      const { error: authUpdErr } = await admin.auth.admin.updateUserById(callerId, {
        email: newEmail,
        email_confirm: true,
      });
      if (authUpdErr) {
        console.error("[update-contact] auth update failed", authUpdErr);
        const msg = authUpdErr.message?.toLowerCase().includes("already")
          ? "This email is already in use by another account."
          : "Could not update email. Please try again.";
        return json({ error: msg }, 409);
      }

      const { error: profUpdErr } = await admin
        .from("user_profiles")
        .update({ email: newEmail })
        .eq("user_id", callerId);
      if (profUpdErr) {
        console.error("[update-contact] profile update failed", profUpdErr);
        // Best-effort rollback
        await admin.auth.admin.updateUserById(callerId, { email: callerEmail });
        return json({ error: "Could not update profile. Please try again." }, 500);
      }

      await admin.from("auth_email_otps").update({ consumed: true }).eq("id", otpRow.id);

      return json({ success: true, requires_relogin: true, email: newEmail });
    }

    // ============================================================
    //   PHONE CHANGE
    // ============================================================
    const newPhoneRaw = String(body?.new_phone ?? "").trim();
    const countryCodeRaw = String(body?.country_code ?? "").trim();
    const dial = countryCodeRaw.replace(/\D+/g, "");
    const phoneDigits = normalizeDigits(newPhoneRaw);
    if (!phoneDigits || !dial) {
      return json({ error: "new_phone and country_code are required" }, 400);
    }
    const fullDigits = `${dial}${phoneDigits}`;

    // Uniqueness: not used by another active user
    const { data: otherProfiles, error: phoneDupErr } = await admin
      .from("user_profiles")
      .select("user_id, phone")
      .neq("user_id", callerId)
      .eq("is_active", true)
      .not("phone", "is", null);
    if (phoneDupErr) {
      console.error("[update-contact] phone dup check failed", phoneDupErr);
      return json({ error: "Could not verify availability." }, 500);
    }
    const clash = (otherProfiles ?? []).find((p: { phone: string | null }) => {
      const stored = normalizeDigits(p.phone);
      return stored && (stored === fullDigits || stored === phoneDigits);
    });
    if (clash) {
      return json({ error: "This phone number is already in use." }, 409);
    }

    // Verify OTP via n8n (uses the bare phone digits, same as login)
    try {
      const verifyRes = await fetch(PHONE_OTP_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "phone", phone: newPhoneRaw, otp }),
      });
      const verifyText = await verifyRes.text();
      let verifyData: any = null;
      try {
        verifyData = verifyText ? JSON.parse(verifyText) : null;
      } catch {
        // non-JSON
      }
      if (!verifyRes.ok) {
        return json(
          {
            error:
              (verifyData && (verifyData.message || verifyData.error)) ||
              "Invalid OTP. Please try again.",
          },
          401,
        );
      }
      const payload = Array.isArray(verifyData) ? verifyData[0] : verifyData;
      const statusVal = payload?.status;
      const statusOk = statusVal === 1 || statusVal === "1" || statusVal === true;
      if (!statusOk) {
        return json(
          {
            error:
              (payload && (payload.message || payload.error)) ||
              "Invalid OTP. Please try again.",
          },
          401,
        );
      }
    } catch (e) {
      console.error("[update-contact] phone OTP verification failed", e);
      return json({ error: "OTP verification service unavailable." }, 502);
    }

    // Store the normalized full phone (digits with country code) — same format
    // as phone-login matches against. Login also accepts bare digits, but
    // storing the full E.164 digits is the safer canonical form.
    const stored = `+${dial}${phoneDigits}`;
    const { error: phoneUpdErr } = await admin
      .from("user_profiles")
      .update({ phone: stored })
      .eq("user_id", callerId);
    if (phoneUpdErr) {
      console.error("[update-contact] phone profile update failed", phoneUpdErr);
      return json({ error: "Could not update phone. Please try again." }, 500);
    }

    return json({ success: true, requires_relogin: false, phone: stored });
  } catch (err) {
    console.error("[update-contact] unexpected", err);
    return json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});