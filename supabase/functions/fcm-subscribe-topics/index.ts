import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Subscribe the caller's FCM device tokens to the topics listed in
// `user_profiles.topic_subscribed`. Optionally accepts a single `token`
// in the request body to subscribe just-registered tokens before they
// are persisted in `user_push_tokens`.

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
};

function b64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    bytes = new Uint8Array(input);
  }
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getGoogleAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(sa.private_key.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`OAuth token failed: ${res.status} ${JSON.stringify(json)}`);
  return json.access_token as string;
}

async function batchAdd(accessToken: string, topic: string, tokens: string[]) {
  const res = await fetch("https://iid.googleapis.com/iid/v1:batchAdd", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "access_token_auth": "true",
    },
    body: JSON.stringify({
      to: `/topics/${topic}`,
      registration_tokens: tokens,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`batchAdd ${topic} failed: ${res.status} ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    let bodyToken: string | undefined;
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        const body = await req.json();
        if (body && typeof body.token === "string" && body.token.length > 0) {
          bodyToken = body.token;
        }
      } catch {
        // ignore
      }
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const [profileRes, tokensRes] = await Promise.all([
      admin
        .from("user_profiles")
        .select("topic_subscribed")
        .eq("user_id", userId)
        .maybeSingle(),
      admin.from("user_push_tokens").select("token").eq("user_id", userId),
    ]);

    if (profileRes.error) throw new Error(`profile fetch: ${profileRes.error.message}`);
    if (tokensRes.error) throw new Error(`tokens fetch: ${tokensRes.error.message}`);

    const topics: string[] = Array.isArray(profileRes.data?.topic_subscribed)
      ? (profileRes.data!.topic_subscribed as string[]).filter(
          (t) => typeof t === "string" && t.length > 0,
        )
      : [];

    const tokenSet = new Set<string>();
    for (const row of tokensRes.data ?? []) {
      if (row?.token) tokenSet.add(row.token as string);
    }
    if (bodyToken) tokenSet.add(bodyToken);
    const tokens = Array.from(tokenSet);

    if (topics.length === 0 || tokens.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          subscribed: [],
          topicsCount: topics.length,
          tokensCount: tokens.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const saRaw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!saRaw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
    const sa = JSON.parse(saRaw) as ServiceAccount;

    const accessToken = await getGoogleAccessToken(sa);

    const results: Record<string, unknown> = {};
    for (const topic of topics) {
      // FCM IID batchAdd accepts up to 1000 tokens per request.
      for (let i = 0; i < tokens.length; i += 1000) {
        const chunk = tokens.slice(i, i + 1000);
        const r = await batchAdd(accessToken, topic, chunk);
        results[`${topic}[${i}-${i + chunk.length}]`] = r;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        topicsCount: topics.length,
        tokensCount: tokens.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[fcm-subscribe-topics] error", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});