// Mints a Supabase session for an existing user only after verifying:
//   - email path: a valid, unconsumed, unexpired server-side OTP (auth_email_otps)
//   - phone path: server re-verifies the OTP with the n8n verify webhook so the
//     client cannot bypass the n8n step by calling this endpoint directly.
// Returns a magic-link token_hash that the client uses with supabase.auth.verifyOtp.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_OTP_ATTEMPTS = 5;
const PHONE_OTP_VERIFY_URL =
  "https://collinz.app.n8n.cloud/webhook/verify-otp";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const emailInput = String(body?.email ?? "").trim().toLowerCase();
    const otpInput = String(body?.otp ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const countryCodeRaw = String(body?.country_code ?? "").trim();
    const portal = String(body?.portal ?? "family").trim().toLowerCase();
    const allowedRoles = portal === "teacher"
      ? ["teacher", "admin", "super_admin"]
      : ["parent", "student"];

    if (!emailInput && (!phone || !countryCodeRaw)) {
      return new Response(
        JSON.stringify({ error: "email or (phone + country_code) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (emailInput && !/^\d{4,8}$/.test(otpInput)) {
      return new Response(
        JSON.stringify({ error: "OTP code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Phone path: OTP is now mandatory and verified server-side via n8n.
    if (!emailInput && !/^\d{4,8}$/.test(otpInput)) {
      return new Response(
        JSON.stringify({ error: "OTP code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // === EMAIL PATH: server-side OTP verification ===
    if (emailInput) {
      // Fetch the most recent unconsumed OTP for this email
      const { data: otpRow, error: otpErr } = await admin
        .from("auth_email_otps")
        .select("id, code_hash, expires_at, attempts, consumed")
        .eq("email", emailInput)
        .eq("consumed", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpErr) {
        console.error("[phone-login] otp lookup failed", otpErr);
        return new Response(
          JSON.stringify({ error: "Verification failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!otpRow) {
        return new Response(
          JSON.stringify({ error: "No OTP issued for this email. Request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (new Date(otpRow.expires_at).getTime() < Date.now()) {
        await admin.from("auth_email_otps").update({ consumed: true }).eq("id", otpRow.id);
        return new Response(
          JSON.stringify({ error: "OTP has expired. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if ((otpRow.attempts ?? 0) >= MAX_OTP_ATTEMPTS) {
        await admin.from("auth_email_otps").update({ consumed: true }).eq("id", otpRow.id);
        return new Response(
          JSON.stringify({ error: "Too many attempts. Please request a new code." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const providedHash = await sha256Hex(otpInput);
      if (providedHash !== otpRow.code_hash) {
        await admin
          .from("auth_email_otps")
          .update({ attempts: (otpRow.attempts ?? 0) + 1 })
          .eq("id", otpRow.id);
        return new Response(
          JSON.stringify({ error: "Invalid OTP code." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Mark consumed on success
      await admin.from("auth_email_otps").update({ consumed: true }).eq("id", otpRow.id);
    }

    const dial = countryCodeRaw.replace(/\D+/g, "");
    const phoneDigits = normalizeDigits(phone);
    const fullDigits = `${dial}${phoneDigits}`;

    // === PHONE PATH: server-side re-verification via n8n ===
    if (!emailInput) {
      try {
        const verifyRes = await fetch(PHONE_OTP_VERIFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "phone",
            phone,
            otp: otpInput,
          }),
        });

        const verifyText = await verifyRes.text();
        let verifyData: any = null;
        try {
          verifyData = verifyText ? JSON.parse(verifyText) : null;
        } catch {
          // non-JSON response
        }

        if (!verifyRes.ok) {
          return new Response(
            JSON.stringify({
              error:
                (verifyData && (verifyData.message || verifyData.error)) ||
                "Invalid OTP. Please try again.",
            }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        const payload = Array.isArray(verifyData) ? verifyData[0] : verifyData;
        const statusVal = payload?.status;
        const statusOk =
          statusVal === 1 || statusVal === "1" || statusVal === true;

        if (!statusOk) {
          return new Response(
            JSON.stringify({
              error:
                (payload && (payload.message || payload.error)) ||
                "Invalid OTP. Please try again.",
            }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      } catch (e) {
        console.error("[phone-login] phone OTP verification failed", e);
        return new Response(
          JSON.stringify({ error: "OTP verification service unavailable." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Look up user profile (role validation happens via user_roles below)
    let query = admin.from("user_profiles").select("user_id, email, phone, role, is_active");
    if (emailInput) {
      query = query.ilike("email", emailInput);
    } else {
      query = query
        .not("phone", "is", null)
        .eq("is_active", true);
    }
    const { data: profiles, error: profilesErr } = await query;

    if (profilesErr) {
      console.error("[phone-login] profiles query failed", profilesErr);
      return new Response(
        JSON.stringify({ error: "Lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Helper: student fallback (email path only, family portal only)
    const tryStudentFallback = async () => {
      if (!emailInput || portal === "teacher") return null;
      const { data: studentRow, error: studentErr } = await admin
        .from("students")
        .select("id, name, email, user_id, archived")
        .ilike("email", emailInput)
        .eq("archived", false)
        .limit(1)
        .maybeSingle();
      if (studentErr) {
        console.error("[phone-login] student lookup failed", studentErr);
        return null;
      }
      if (!studentRow) return null;

      let userId = studentRow.user_id as string | null;
      if (!userId) {
        // Try to find an existing auth user with this email first
        try {
          const { data: list } = await admin.auth.admin.listUsers();
          const existing = list?.users?.find(
            (u: any) => (u.email ?? "").toLowerCase() === emailInput,
          );
          if (existing) userId = existing.id;
        } catch (e) {
          console.warn("[phone-login] listUsers failed", e);
        }
        if (!userId) {
          const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email: emailInput,
            email_confirm: true,
          });
          if (createErr || !created?.user) {
            console.error("[phone-login] createUser failed", createErr);
            return null;
          }
          userId = created.user.id;
        }
        await admin.from("students").update({ user_id: userId }).eq("id", studentRow.id);
      }

      // Ensure 'student' role exists
      await admin
        .from("user_roles")
        .upsert({ user_id: userId, role: "student" }, { onConflict: "user_id,role" });

      // Ensure user_profiles row exists (AuthContext depends on it)
      await admin
        .from("user_profiles")
        .upsert(
          {
            user_id: userId,
            email: emailInput,
            full_name: studentRow.name ?? null,
            role: "student",
            is_active: true,
          },
          { onConflict: "user_id" },
        );

      return { user_id: userId, email: emailInput };
    };

    // Find the profile by contact info (email or phone)
    const candidates = emailInput
      ? (profiles ?? []).filter((p: any) => (p.email ?? "").toLowerCase() === emailInput)
      : (profiles ?? []).filter((p: any) => {
          const stored = normalizeDigits(p.phone);
          if (!stored) return false;
          return stored === fullDigits || stored === phoneDigits;
        });

    if (candidates.length === 0) {
      const studentMatch = await tryStudentFallback();
      if (studentMatch) {
        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email: studentMatch.email,
        });
        if (linkErr || !linkData?.properties?.hashed_token) {
          console.error("[phone-login] generateLink (student) failed", linkErr);
          return new Response(
            JSON.stringify({ error: "Failed to mint session token" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({
            email: studentMatch.email,
            token_hash: linkData.properties.hashed_token,
            user_id: studentMatch.user_id,
            account_type: "student",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          error: emailInput
            ? `No ${portal === "teacher" ? "teacher" : "parent or student"} account found for this email.`
            : `No ${portal === "teacher" ? "teacher" : "parent"} account found for this phone number.`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Authoritative role check via user_roles table
    const candidateIds = candidates.map((c: any) => c.user_id);
    const { data: roleRows, error: rolesErr } = await admin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", candidateIds);

    if (rolesErr) {
      console.error("[phone-login] user_roles lookup failed", rolesErr);
      return new Response(
        JSON.stringify({ error: "Role lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rolesByUser = new Map<string, string[]>();
    for (const r of roleRows ?? []) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }

    const match = candidates.find((c: any) =>
      (rolesByUser.get(c.user_id) ?? []).some((r) => allowedRoles.includes(r)),
    );

    if (!match) {
      // Last-chance student fallback (email path): user_profiles existed but no parent role
      const studentMatch = await tryStudentFallback();
      if (studentMatch) {
        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email: studentMatch.email,
        });
        if (!linkErr && linkData?.properties?.hashed_token) {
          return new Response(
            JSON.stringify({
              email: studentMatch.email,
              token_hash: linkData.properties.hashed_token,
              user_id: studentMatch.user_id,
              account_type: "student",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
      const wrongPortalCandidate = candidates[0];
      const otherRoles = rolesByUser.get(wrongPortalCandidate.user_id) ?? [];
      const isTeacherSide = otherRoles.some((r) =>
        ["teacher", "admin", "super_admin"].includes(r),
      );
      const correctPortal = isTeacherSide ? "Teacher" : "Parent / Student";
      return new Response(
        JSON.stringify({
          error: otherRoles.length
            ? `This account does not have ${portal === "teacher" ? "teacher" : "parent"} access. Please sign in via the ${correctPortal} portal.`
            : `No ${portal === "teacher" ? "teacher" : "parent"} role assigned to this account.`,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (match.is_active === false) {
      return new Response(
        JSON.stringify({ error: "This account is inactive. Please contact the school." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!match.email) {
      return new Response(
        JSON.stringify({ error: "Account is missing an email — cannot create session." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Ensure auth user is confirmed so magic link works.
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(match.user_id);
      if (authUser?.user && !authUser.user.email_confirmed_at) {
        await admin.auth.admin.updateUserById(match.user_id, { email_confirm: true });
      }
    } catch (e) {
      console.warn("[phone-login] confirm user failed (continuing)", e);
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: match.email,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("[phone-login] generateLink failed", linkErr);
      return new Response(
        JSON.stringify({ error: "Failed to mint session token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        email: match.email,
        token_hash: linkData.properties.hashed_token,
        user_id: match.user_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[phone-login] unexpected error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
