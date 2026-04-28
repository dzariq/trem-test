import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeDigits(input: string | null | undefined): string {
  if (!input) return "";
  let d = String(input).replace(/\D+/g, "");
  while (d.startsWith("0")) d = d.slice(1);
  return d;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const phone = String(body?.phone ?? "").trim();
    const countryCodeRaw = String(body?.country_code ?? "").trim();

    if (!phone || !countryCodeRaw) {
      return new Response(
        JSON.stringify({ error: "phone and country_code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dial = countryCodeRaw.replace(/\D+/g, "");
    const phoneDigits = normalizeDigits(phone);
    const fullDigits = `${dial}${phoneDigits}`; // e.g. 60192300024

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Pull active parent profiles. RLS bypassed via service role.
    const { data: profiles, error: profilesErr } = await admin
      .from("user_profiles")
      .select("user_id, email, phone, role, is_active")
      .eq("role", "parent")
      .not("phone", "is", null);

    if (profilesErr) {
      console.error("[phone-login] profiles query failed", profilesErr);
      return new Response(
        JSON.stringify({ error: "Lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Match by normalized digits. We try exact full match (countrycode+phone)
    // and also fallback to plain phone digits (in case stored with country code already).
    const match = (profiles ?? []).find((p: any) => {
      const stored = normalizeDigits(p.phone);
      if (!stored) return false;
      return stored === fullDigits || stored === phoneDigits;
    });

    if (!match) {
      return new Response(
        JSON.stringify({ error: "No parent account found for this phone number." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (match.is_active === false) {
      return new Response(
        JSON.stringify({ error: "This parent account is inactive. Please contact the school." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!match.email) {
      return new Response(
        JSON.stringify({ error: "Account is missing an email — cannot create session." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Generate a magic-link token; we return the hashed_token so the client
    // can call supabase.auth.verifyOtp({ type: 'magiclink', token_hash, email }).
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