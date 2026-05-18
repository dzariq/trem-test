// Generates a 6-digit OTP server-side, stores a SHA-256 hash with TTL,
// rate-limits per email, and delivers the code via Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM_ADDRESS =
  Deno.env.get("RESEND_FROM_ADDRESS") ?? "Collinz <onboarding@resend.dev>";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const OTP_TTL_SECONDS = 300; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_MINUTES = 15;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateOtp(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const n = 100000 + (buf[0] % 900000);
  return n.toString();
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildEmail(otp: string, ttlSeconds: number) {
  const safeOtp = escapeHtml(otp);
  const minutes = Math.max(1, Math.round(ttlSeconds / 60));
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.04);overflow:hidden;">
<tr><td style="background:#0B5D28;padding:28px 32px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;">Collinz School Management</h1></td></tr>
<tr><td style="padding:36px 32px 24px 32px;color:#2c3e50;">
<p style="margin:0 0 16px;font-size:16px;">Hello,</p>
<p style="margin:0 0 28px;font-size:15px;color:#4a5568;">Your one-time password (OTP) for the Collinz School Management App is:</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="background:#f0f4f8;border:1px dashed #cbd5e0;border-radius:8px;padding:20px;">
<span style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;color:#1e3a5f;letter-spacing:8px;">${safeOtp}</span>
</td></tr></table>
<p style="margin:28px 0 0;font-size:14px;color:#4a5568;">This code expires in ${minutes} minute${minutes === 1 ? "" : "s"}.</p>
<p style="margin:16px 0 0;font-size:14px;color:#718096;">If you did not request this, please contact the school admin.</p>
</td></tr>
<tr><td style="background:#0B5D28;padding:20px 32px;text-align:center;"><p style="margin:0;font-size:12px;color:#a0aec0;">This is an automated message from Collinz School Management.<br>Please do not reply to this email.</p></td></tr>
</table></td></tr></table></body></html>`;
  const text = `Your Collinz OTP code is ${otp}.\nThis code expires in ${minutes} minute${minutes === 1 ? "" : "s"}.\n\nIf you did not request this, please contact the school admin.`;
  return { html, text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY =
      Deno.env.get("RESEND_API_KEY_1") ?? Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !RESEND_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "A valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Rate limit: count recent requests for this email
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count: recentCount, error: countErr } = await admin
      .from("auth_email_otps")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", windowStart);

    if (countErr) {
      console.error("[send-email-otp] rate-limit query failed", countErr);
    } else if ((recentCount ?? 0) >= MAX_REQUESTS_PER_WINDOW) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please try again in a few minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const otp = generateOtp();
    const codeHash = await sha256Hex(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    // Invalidate any earlier outstanding codes for this email
    await admin
      .from("auth_email_otps")
      .update({ consumed: true })
      .eq("email", email)
      .eq("consumed", false);

    const { error: insertErr } = await admin.from("auth_email_otps").insert({
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
      ip,
    });

    if (insertErr) {
      console.error("[send-email-otp] insert failed", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to issue OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { html, text } = buildEmail(otp, OTP_TTL_SECONDS);

    const resendRes = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: `Your login code: ${otp}`,
        html,
        text,
      }),
    });

    const resendBody = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      console.error("[send-email-otp] Resend error", resendRes.status, resendBody);
      return new Response(
        JSON.stringify({
          error:
            (resendBody as any)?.message ??
            `Email delivery failed (${resendRes.status})`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, ttl_seconds: OTP_TTL_SECONDS }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-email-otp] unexpected error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
